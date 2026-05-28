import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  private async ensureBarbersBelongToTenant(barberIds: string[] = [], tenantId?: string) {
    const uniqueIds = Array.from(new Set(barberIds.filter(Boolean)));
    if (uniqueIds.length === 0 || !tenantId) return;
    const count = await this.prisma.barber.count({
      where: {
        id: { in: uniqueIds },
        user: { tenantId },
      },
    });
    if (count !== uniqueIds.length) {
      throw new Error('Profissional inválido para este estabelecimento');
    }
  }

  async findAll(tenantId?: string) {
    return this.prisma.service.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        barbers: {
          select: {
            id: true,
            user: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async create(data: any, currentUser?: any, tenantId?: string) {
    await this.ensureBarbersBelongToTenant([
      ...(data.barberIds || []),
      ...((data.customCommissions || []).map((cc: any) => cc.barberId)),
    ], tenantId);

    const service = await this.prisma.service.create({
      data: {
        nome: data.nome,
        preco: parseFloat(data.preco),
        duracao: parseInt(data.duracao, 10),
        descricao: data.descricao || null,
        tenantId: tenantId || null,
        barbers: data.barberIds ? {
          connect: data.barberIds.map((id: string) => ({ id })),
        } : undefined,
        customCommissions: data.customCommissions && data.customCommissions.length > 0 ? {
          create: data.customCommissions.map((cc: any) => ({
            barberId: cc.barberId,
            commissionRate: parseFloat(cc.commissionRate),
          })),
        } : undefined,
      },
      include: {
        barbers: {
          select: {
            id: true,
            user: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        usuario: currentUser?.nome || currentUser?.email || 'Sistema',
        acao: 'CREATE_SERVICE',
        detalhes: `Serviço "${service.nome}" criado com preço R$ ${service.preco} e duração ${service.duracao} min.`,
        tenantId: tenantId || null,
      },
    });

    return service;
  }

  async update(id: string, data: any, currentUser?: any, tenantId?: string) {
    const existing = await this.prisma.service.findFirst({
      where: {
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
    });
    if (!existing) {
      throw new Error('Serviço não encontrado neste estabelecimento');
    }
    await this.ensureBarbersBelongToTenant([
      ...(data.barberIds || []),
      ...((data.customCommissions || []).map((cc: any) => cc.barberId)),
    ], tenantId);
    
    const updateData: any = {
      nome: data.nome,
      preco: data.preco ? parseFloat(data.preco) : undefined,
      duracao: data.duracao ? parseInt(data.duracao, 10) : undefined,
      descricao: data.descricao !== undefined ? data.descricao : undefined,
      barbers: data.barberIds ? {
        set: data.barberIds.map((id: string) => ({ id })),
      } : undefined,
    };

    if (data.customCommissions !== undefined) {
      await this.prisma.serviceCommission.deleteMany({
        where: { serviceId: id },
      });

      if (data.customCommissions.length > 0) {
        updateData.customCommissions = {
          create: data.customCommissions.map((cc: any) => ({
            barberId: cc.barberId,
            commissionRate: parseFloat(cc.commissionRate),
          })),
        };
      }
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        barbers: {
          select: {
            id: true,
            user: {
              select: {
                nome: true,
              },
            },
          },
        },
        customCommissions: true,
      },
    });

    if (data.preco && parseFloat(data.preco) !== existing.preco) {
      await this.prisma.auditLog.create({
        data: {
          usuario: currentUser?.nome || currentUser?.email || 'Sistema',
          acao: 'CHANGE_SERVICE_PRICE',
          detalhes: `Preço do serviço "${existing.nome}" alterado de R$ ${existing.preco} para R$ ${parseFloat(data.preco)}.`,
          tenantId: tenantId || null,
        },
      });
    }

    return service;
  }

  async delete(id: string, currentUser?: any, tenantId?: string) {
    const existing = await this.prisma.service.findFirst({
      where: {
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
    });
    if (!existing) {
      throw new Error('Serviço não encontrado neste estabelecimento');
    }

    await this.prisma.auditLog.create({
      data: {
        usuario: currentUser?.nome || currentUser?.email || 'Sistema',
        acao: 'DELETE_SERVICE',
        detalhes: `Serviço "${existing.nome}" (Preço: R$ ${existing.preco}) foi excluído.`,
        tenantId: tenantId || null,
      },
    });

    return this.prisma.service.delete({ where: { id } });
  }
}
