import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4000;
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';

  // Security Middleware
  app.use(helmet());
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PMP - Project Management Portal API')
    .setDescription('Production-grade enterprise Project Management Portal REST API (Phase 1)')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'Login, token refresh, logout, password and profile endpoints')
    .addTag('Users', 'User lifecycle, status management, and directory')
    .addTag('Roles', 'Role configuration and permission assignment')
    .addTag('Permissions', 'System permission registry')
    .addTag('Departments', 'Department directory and member counts')
    .addTag('Teams', 'Team directory and roster management')
    .addTag('Clients', 'Client organizations and accounts')
    .addTag('Projects', 'Project management, health, dates, and member assignment')
    .addTag('Activity Logs', 'Audit and system activity logs')
    .addTag('Health', 'System and database health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'PMP API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      docExpansion: 'list',
    },
  });

  await app.listen(port);
  logger.log(`🚀 PMP Backend running on http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
