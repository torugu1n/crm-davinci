import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

const PROFESSIONAL_ROLES = ['BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE'];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private normalizeRoles(role: string, roles?: string[]) {
    const merged = Array.from(new Set([role, ...(roles || [])].filter(Boolean)));
    if (merged.length === 0) {
      throw new BadRequestException('Ao menos uma permissão deve ser informada');
    }
    return merged;
  }

  private hasProfessionalRole(roles: string[]) {
    return roles.some((role) => PROFESSIONAL_ROLES.includes(role));
  }

  private buildProfessionalCategory(roles: string[]) {
    const professionalRoles = roles.filter((role) => PROFESSIONAL_ROLES.includes(role));
    if (professionalRoles.length === 0) return 'PROFESSIONAL';
    return professionalRoles.join(', ');
  }

  async findAll(tenantId?: string) {
    return this.prisma.user.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        barber: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { barber: true },
    });

    if (!user || (tenantId && user.tenantId !== tenantId)) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async create(data: any, tenantId?: string) {
    if (!data.nome || !data.email || !data.senha || !data.role) {
      throw new BadRequestException('Nome, e-mail, senha e perfil principal são obrigatórios');
    }

    const roles = this.normalizeRoles(data.role, data.roles);
    const senhaHash = await bcrypt.hash(data.senha, 10);

    const user = await this.prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: senhaHash,
        role: data.role,
        roles,
        isActive: data.isActive !== false,
        tenantId: tenantId || null,
      },
      include: {
        barber: true,
      },
    });

    if (this.hasProfessionalRole(roles)) {
      await this.prisma.barber.create({
        data: {
          userId: user.id,
          categoria: this.buildProfessionalCategory(roles),
          especialidade: data.especialidade || 'Especialidade a definir',
          miniBio: data.miniBio || null,
          fotoUrl: data.fotoUrl || null,
          commissionRate: data.commissionRate ?? 50,
        },
      });
    }

    return this.findOne(user.id, tenantId);
  }

  async update(id: string, data: any, tenantId?: string) {
    const existing = await this.findOne(id, tenantId);

    const nextRole = data.role || existing.role;
    const roles = this.normalizeRoles(nextRole, data.roles || existing.roles);

    const userData: Record<string, any> = {
      nome: data.nome,
      email: data.email,
      role: nextRole,
      roles,
      isActive: data.isActive,
    };

    if (data.senha) {
      userData.senha = await bcrypt.hash(data.senha, 10);
    }

    await this.prisma.user.update({
      where: { id },
      data: userData,
    });

    if (this.hasProfessionalRole(roles)) {
      if (existing.barber) {
        await this.prisma.barber.update({
          where: { id: existing.barber.id },
          data: {
            categoria: this.buildProfessionalCategory(roles),
            especialidade: data.especialidade ?? existing.barber.especialidade,
            miniBio: data.miniBio !== undefined ? data.miniBio || null : existing.barber.miniBio,
            fotoUrl: data.fotoUrl !== undefined ? data.fotoUrl || null : existing.barber.fotoUrl,
            commissionRate: data.commissionRate ?? existing.barber.commissionRate,
          },
        });
      } else {
        await this.prisma.barber.create({
          data: {
            userId: id,
            categoria: this.buildProfessionalCategory(roles),
            especialidade: data.especialidade || 'Especialidade a definir',
            miniBio: data.miniBio || null,
            fotoUrl: data.fotoUrl || null,
            commissionRate: data.commissionRate ?? 50,
          },
        });
      }
    } else if (existing.barber) {
      await this.prisma.barber.delete({
        where: { id: existing.barber.id },
      });
    }

    return this.findOne(id, tenantId);
  }

  async delete(id: string, tenantId?: string) {
    await this.findOne(id, tenantId);

    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }
}
