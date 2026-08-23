import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MyWorkService } from './my-work.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('My Work')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('my-work')
export class MyWorkController {
  constructor(private readonly myWorkService: MyWorkService) {}

  @ApiOperation({ summary: 'Get aggregated tasks assigned to current logged-in user' })
  @Get()
  getMyWork(@CurrentUser() user: AuthenticatedUser) {
    return this.myWorkService.getMyWork(user);
  }
}
