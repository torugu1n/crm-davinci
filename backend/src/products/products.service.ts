import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
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
    return this.prisma.product.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { nome: 'asc' },
    });
  }

  async create(data: any, tenantId?: string) {
    await this.ensureBarbersBelongToTenant((data.customCommissions || []).map((cc: any) => cc.barberId), tenantId);
    const commissionRate = data.commissionRate ? parseFloat(data.commissionRate) : 0;
    return this.prisma.product.create({
      data: {
        nome: data.nome,
        preco: parseFloat(data.preco),
        descricao: data.descricao || null,
        commissionRate,
        tenantId: tenantId || null,
        customCommissions: data.customCommissions && data.customCommissions.length > 0 ? {
          create: data.customCommissions.map((cc: any) => ({
            barberId: cc.barberId,
            commissionRate: parseFloat(cc.commissionRate),
          })),
        } : undefined,
      },
      include: {
        customCommissions: true,
      },
    });
  }

  async update(id: string, data: any, tenantId?: string) {
    const existing = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
    });
    if (!existing) {
      throw new Error('Produto não encontrado neste estabelecimento');
    }
    await this.ensureBarbersBelongToTenant((data.customCommissions || []).map((cc: any) => cc.barberId), tenantId);

    const updateData: any = {
      nome: data.nome,
      preco: data.preco ? parseFloat(data.preco) : undefined,
      descricao: data.descricao !== undefined ? data.descricao : undefined,
      commissionRate: data.commissionRate !== undefined ? parseFloat(data.commissionRate) : undefined,
    };

    if (data.customCommissions !== undefined) {
      await this.prisma.productCommission.deleteMany({
        where: { productId: id },
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

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        customCommissions: true,
      },
    });
  }

  async delete(id: string, tenantId?: string) {
    const existing = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
    });
    if (!existing) {
      throw new Error('Produto não encontrado neste estabelecimento');
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
