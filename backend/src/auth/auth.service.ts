import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateStaff(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
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

    // Limpar o telefone para manter padrão de busca (apenas números)
    const cleanedPhone = telefone.replace(/\D/g, '');
    if (cleanedPhone.length < 8) {
      throw new BadRequestException('Telefone inválido');
    }

    // Busca flexível comparando os últimos 8 dígitos (evita duplicar registros do WhatsApp Webhook)
    const last8 = cleanedPhone.substring(cleanedPhone.length - 8);
    const clients = await this.prisma.client.findMany();
    let client = clients.find((c) => {
      const cPhoneCleaned = c.telefone.replace(/\D/g, '');
      return cPhoneCleaned.endsWith(last8);
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          nome,
          telefone: cleanedPhone,
          aniversario: aniversario || null,
          observacoes: 'Cliente cadastrado via portal simplificado.',
        },
      });
    } else if (aniversario && !client.aniversario) {
      // Atualizar aniversário caso o cliente já exista mas não tenha o dado salvo
      client = await this.prisma.client.update({
        where: { id: client.id },
        data: { aniversario },
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
