import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const defaultSecret = 'davinci_gold_secret_key_2026_exclusive';

if (isProduction && (!jwtSecret || jwtSecret === defaultSecret)) {
  throw new Error('FATAL: A secure JWT_SECRET environment variable must be set in production!');
}

const secretKey = jwtSecret || defaultSecret;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      roles: payload.roles || [payload.role],
      isActive: payload.isActive !== false,
      tenantId: payload.tenantId || null,
    };
  }
}
