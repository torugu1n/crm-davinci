import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        customCommissions: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async create(data: any) {
    const commissionRate = data.commissionRate ? parseFloat(data.commissionRate) : 0;
    return this.prisma.product.create({
      data: {
        nome: data.nome,
        preco: parseFloat(data.preco),
        descricao: data.descricao || null,
        commissionRate,
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

  async update(id: string, data: any) {
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

  async delete(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
