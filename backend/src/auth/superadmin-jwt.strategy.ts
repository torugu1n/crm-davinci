import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const defaultSecret = 'davinci_gold_secret_key_2026_exclusive';

if (isProduction && (!jwtSecret || jwtSecret === defaultSecret)) {
  throw new Error('FATAL: A secure JWT_SECRET environment variable must be set in production!');
}

const secretKey = jwtSecret || defaultSecret;

@Injectable()
export class SuperAdminJwtStrategy extends PassportStrategy(Strategy, 'superadmin-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  async validate(payload: any) {
    if (payload.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Acesso restrito a super administradores');
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      roles: payload.roles || [payload.role],
      isActive: payload.isActive !== false,
      tenantId: null,
    };
  }
}
