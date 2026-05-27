import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
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
      orderBy: { nome: 'asc' },
    });
  }

  async create(data: any, currentUser?: any) {
    const service = await this.prisma.service.create({
      data: {
        nome: data.nome,
        preco: parseFloat(data.preco),
        duracao: parseInt(data.duracao, 10),
        descricao: data.descricao || null,
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
        customCommissions: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        usuario: currentUser?.nome || currentUser?.email || 'Sistema',
        acao: 'CREATE_SERVICE',
        detalhes: `Serviço "${service.nome}" criado com preço R$ ${service.preco} e duração ${service.duracao} min.`,
      },
    });

    return service;
  }

  async update(id: string, data: any, currentUser?: any) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    
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

    if (existing) {
      if (data.preco && parseFloat(data.preco) !== existing.preco) {
        await this.prisma.auditLog.create({
          data: {
            usuario: currentUser?.nome || currentUser?.email || 'Sistema',
            acao: 'CHANGE_SERVICE_PRICE',
            detalhes: `Preço do serviço "${existing.nome}" alterado de R$ ${existing.preco} para R$ ${parseFloat(data.preco)}.`,
          },
        });
      }
    }

    return service;
  }

  async delete(id: string, currentUser?: any) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (existing) {
      await this.prisma.auditLog.create({
        data: {
          usuario: currentUser?.nome || currentUser?.email || 'Sistema',
          acao: 'DELETE_SERVICE',
          detalhes: `Serviço "${existing.nome}" (Preço: R$ ${existing.preco}) foi excluído.`,
        },
      });
    }
    return this.prisma.service.delete({ where: { id } });
  }
}
