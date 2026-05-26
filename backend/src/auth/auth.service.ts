import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { extractPhoneDigits, normalizeBirthday, normalizePhone } from '../clients/client-formatters';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private normalizeStaffIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      return normalized;
    }

    return normalized.includes('@') ? normalized : `${normalized}@salao.com`;
  }

  async validateStaff(email: string, pass: string): Promise<any> {
    const normalizedEmail = this.normalizeStaffIdentifier(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { barber: true },
    });
    if (user && user.isActive && (await bcrypt.compare(pass, user.senha))) {
      const { senha, ...result } = user;
      return result;
    }
    return null;
  }

  async staffLogin(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, roles: user.roles, isActive: user.isActive };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        roles: user.roles,
        isActive: user.isActive,
        barberId: user.barber?.id || null,
      },
    };
  }

  async clientLogin(nome: string, telefone: string, aniversario?: string) {
    if (!nome || !telefone) {
      throw new BadRequestException('Nome e telefone são obrigatórios');
    }

    const formattedPhone = normalizePhone(telefone);
    const cleanedPhone = extractPhoneDigits(formattedPhone);
    const normalizedBirthday = normalizeBirthday(aniversario);

    const last8 = cleanedPhone.substring(cleanedPhone.length - 8);
    const clients = await this.prisma.client.findMany();
    let client = clients.find((c) => {
      const cPhoneCleaned = extractPhoneDigits(c.telefone);
      return cPhoneCleaned.endsWith(last8);
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          nome,
          telefone: formattedPhone,
          aniversario: normalizedBirthday,
          observacoes: 'Cliente cadastrado via portal simplificado.',
        },
      });
    } else if (client.telefone !== formattedPhone || (normalizedBirthday && !client.aniversario)) {
      client = await this.prisma.client.update({
        where: { id: client.id },
        data: {
          telefone: formattedPhone,
          aniversario: client.aniversario || normalizedBirthday,
        },
      });
    }

    const payload = { sub: client.id, phone: client.telefone, role: 'CLIENT' };
    return {
      access_token: this.jwtService.sign(payload),
      client: {
        id: client.id,
        nome: client.nome,
        telefone: client.telefone,
        role: 'CLIENT',
      },
    };
  }
}
