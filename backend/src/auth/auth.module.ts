import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { SuperAdminJwtStrategy } from './superadmin-jwt.strategy';
import { SuperAdminJwtAuthGuard } from './superadmin-jwt-auth.guard';
import { TenantOrSuperAdminAuthGuard } from './tenant-or-superadmin-auth.guard';
import { SystemSettingsModule } from '../settings/system-settings.module';
import { EmailVerificationService } from './email-verification.service';
import { RedisService } from '../redis.service';

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const defaultSecret = 'davinci_gold_secret_key_2026_exclusive';

if (isProduction && (!jwtSecret || jwtSecret === defaultSecret)) {
  throw new Error('FATAL: A secure JWT_SECRET environment variable must be set in production!');
}

const secretKey = jwtSecret || defaultSecret;

@Module({
  imports: [
    PassportModule,
    SystemSettingsModule,
    JwtModule.register({
      secret: secretKey,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    SuperAdminJwtStrategy,
    SuperAdminJwtAuthGuard,
    TenantOrSuperAdminAuthGuard,
    EmailVerificationService,
    RedisService,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, SuperAdminJwtAuthGuard, TenantOrSuperAdminAuthGuard, EmailVerificationService],
})
export class AuthModule {}
