import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.product.create({
      data: {
        nome: data.nome,
        preco: parseFloat(data.preco),
        descricao: data.descricao || null,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data: {
        nome: data.nome,
        preco: data.preco ? parseFloat(data.preco) : undefined,
        descricao: data.descricao !== undefined ? data.descricao : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
