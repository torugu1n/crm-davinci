import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'davinci_gold_secret_key_2026_exclusive',
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
    };
  }
}
