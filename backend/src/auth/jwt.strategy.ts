import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const defaultSecret = 'davinci_gold_secret_key_2026_exclusive';

if (isProduction && (!jwtSecret || jwtSecret === defaultSecret)) {
  throw new Error('FATAL: A secure JWT_SECRET environment variable must be set in production!');
}

const secretKey = jwtSecret || defaultSecret;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  async validate(payload: any) {
    // Check if it's a client
    if (payload.role === 'CLIENT') {
      const client = await this.prisma.client.findUnique({
        where: { id: payload.sub },
      });
      if (!client) {
        throw new UnauthorizedException('Cliente inválido');
      }
      return {
        id: client.id,
        phone: client.telefone,
        role: 'CLIENT',
        roles: ['CLIENT'],
        isActive: true,
        tenantId: client.tenantId,
      };
    }

    // Otherwise it's a staff member
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { barber: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário inválido ou inativo');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles || [user.role],
      isActive: user.isActive,
      barberId: user.barber?.id || null,
      tenantId: user.tenantId || null,
    };
  }
}
