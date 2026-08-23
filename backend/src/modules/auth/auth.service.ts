import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { LoginDto, RefreshTokenDto, ChangePasswordDto } from './dto/login.dto';
import { AuditAction, AuditEntityType, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'pmp-jwt-super-secret-key-2026-phase-1-build',
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as any,
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpiresDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);

    return {
      accessToken,
      rawRefreshToken,
      tokenHash: this.hashToken(rawRefreshToken),
      expiresAt,
    };
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        department: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Your account is currently ${user.status.toLowerCase()}. Please contact support.`);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { accessToken, rawRefreshToken, tokenHash, expiresAt } = this.generateTokens(user.id, user.email);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log activity
    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.LOGIN,
      entityType: AuditEntityType.AUTH,
      entityId: user.id,
      ipAddress,
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionSet = new Set<string>();
    if (roles.includes('SUPER_ADMIN')) {
      permissionSet.add('*');
    }
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        status: user.status,
        department: user.department ? { id: user.department.id, name: user.department.name } : null,
        roles,
        permissions: Array.from(permissionSet),
      },
    };
  }

  async refreshTokens(dto: RefreshTokenDto, ipAddress?: string) {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    const { user } = storedToken;
    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is invalid or inactive.');
    }

    // Revoke used refresh token (Token Rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new pair
    const { accessToken, rawRefreshToken, tokenHash: newHash, expiresAt } = this.generateTokens(user.id, user.email);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: newHash,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string, ipAddress?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId },
        data: { isRevoked: true },
      });
    }

    await this.activityLogs.log({
      actorId: userId,
      action: AuditAction.LOGOUT,
      entityType: AuditEntityType.AUTH,
      entityId: userId,
      ipAddress,
    });

    return { success: true, message: 'Logged out successfully.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      // Revoke all refresh tokens for user to force re-login on other devices
      this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      }),
    ]);

    await this.activityLogs.log({
      actorId: userId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: userId,
      metadata: { action: 'CHANGE_PASSWORD' },
      ipAddress,
    });

    return { success: true, message: 'Password updated successfully. Please log in again.' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionSet = new Set<string>();
    if (roles.includes('SUPER_ADMIN')) {
      permissionSet.add('*');
    }
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      status: user.status,
      department: user.department,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      roles,
      permissions: Array.from(permissionSet),
    };
  }
}
