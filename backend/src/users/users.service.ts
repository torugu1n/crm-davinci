import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

const PROFESSIONAL_ROLES = ['BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP'];
const ALLOWED_STAFF_ROLES = ['ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP', 'SUPER_ADMIN'];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private normalizeRoles(role: string, roles?: string[]) {
    const merged = Array.from(new Set([role, ...(roles || [])].filter(Boolean)));
    if (merged.length === 0) {
      throw new BadRequestException('Ao menos uma permissão deve ser informada');
    }
    const invalidRole = merged.find((item) => !ALLOWED_STAFF_ROLES.includes(item));
    if (invalidRole) {
      throw new BadRequestException(`Permissão inválida: ${invalidRole}`);
    }
    return merged;
  }

  private sanitizeUser(user: any) {
    if (!user) return user;
    const { senha, ...safeUser } = user;
    return safeUser;
  }

  private ensureCanManageRoles(currentUser: any, roles: string[]) {
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.roles?.includes('SUPER_ADMIN');
    if (!isSuperAdmin && roles.includes('SUPER_ADMIN')) {
      throw new BadRequestException('Apenas super administradores podem conceder permissão SUPER_ADMIN');
    }
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
    let whereClause: any = {};
    
    if (!tenantId) {
      // Super Admin global view: filter to only include users who registered on the platform 
      // (meaning they have a verified EmailVerification record) or are SUPER_ADMIN.
      const verifiedVerifications = await this.prisma.emailVerification.findMany({
        where: { verified: true },
        select: { email: true }
      });
      const verifiedEmails = Array.from(new Set(verifiedVerifications.map(v => v.email.toLowerCase().trim())));
      
      whereClause = {
        OR: [
          { email: { in: verifiedEmails } },
          { role: 'SUPER_ADMIN' }
        ]
      };
    } else {
      whereClause = { tenantId };
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      include: {
        barber: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
    return users.map((user) => this.sanitizeUser(user));
  }

  async findOne(id: string, tenantId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { barber: true },
    });

    if (!user || (tenantId && user.tenantId !== tenantId)) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.sanitizeUser(user);
  }

  async create(data: any, tenantId?: string, currentUser?: any) {
    if (!data.nome || !data.email || !data.senha || !data.role) {
      throw new BadRequestException('Nome, e-mail, senha e perfil principal são obrigatórios');
    }

    const roles = this.normalizeRoles(data.role, data.roles);
    this.ensureCanManageRoles(currentUser, roles);

    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (tenant) {
        if (this.hasProfessionalRole(roles) && data.isActive !== false) {
          const activeBarbers = await this.prisma.user.count({
            where: {
              tenantId,
              isActive: true,
              roles: { hasSome: PROFESSIONAL_ROLES },
            },
          });
          if (activeBarbers >= tenant.saasPlanLimitBarbers) {
            throw new BadRequestException(
              `Limite de profissionais atingido para o seu plano (${tenant.saasPlanLimitBarbers}). Faça upgrade para o plano Absoluto para cadastrar mais profissionais.`
            );
          }
        }
        if (roles.includes('ATTENDANT') && data.isActive !== false) {
          const activeAttendants = await this.prisma.user.count({
            where: {
              tenantId,
              isActive: true,
              roles: { has: 'ATTENDANT' },
            },
          });
          if (activeAttendants >= tenant.saasPlanLimitAttendants) {
            throw new BadRequestException(
              `Limite de atendentes atingido para o seu plano (${tenant.saasPlanLimitAttendants}). Faça upgrade para o plano Absoluto para cadastrar mais atendentes.`
            );
          }
        }
      }
    }

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

  async update(id: string, data: any, tenantId?: string, currentUser?: any) {
    const existing = await this.findOne(id, tenantId);

    const nextRole = data.role || existing.role;
    const roles = this.normalizeRoles(nextRole, data.roles || existing.roles);
    this.ensureCanManageRoles(currentUser, roles);
    const isActive = data.isActive !== undefined ? data.isActive : existing.isActive;

    const resolvedTenantId = tenantId || existing.tenantId;
    if (resolvedTenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: resolvedTenantId },
      });
      if (tenant) {
        const wasActiveProfessional = existing.isActive && this.hasProfessionalRole(existing.roles);
        if (this.hasProfessionalRole(roles) && isActive && !wasActiveProfessional) {
          const activeBarbers = await this.prisma.user.count({
            where: {
              tenantId: resolvedTenantId,
              isActive: true,
              roles: { hasSome: PROFESSIONAL_ROLES },
            },
          });
          if (activeBarbers >= tenant.saasPlanLimitBarbers) {
            throw new BadRequestException(
              `Limite de profissionais atingido para o seu plano (${tenant.saasPlanLimitBarbers}). Faça upgrade para o plano Absoluto para cadastrar mais profissionais.`
            );
          }
        }

        const wasActiveAttendant = existing.isActive && existing.roles.includes('ATTENDANT');
        if (roles.includes('ATTENDANT') && isActive && !wasActiveAttendant) {
          const activeAttendants = await this.prisma.user.count({
            where: {
              tenantId: resolvedTenantId,
              isActive: true,
              roles: { has: 'ATTENDANT' },
            },
          });
          if (activeAttendants >= tenant.saasPlanLimitAttendants) {
            throw new BadRequestException(
              `Limite de atendentes atingido para o seu plano (${tenant.saasPlanLimitAttendants}). Faça upgrade para o plano Absoluto para cadastrar mais atendentes.`
            );
          }
        }
      }
    }

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
