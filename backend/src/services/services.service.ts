import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.service.create({
      data: {
        nome: data.nome,
        preco: parseFloat(data.preco),
        duracao: parseInt(data.duracao, 10),
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.service.update({
      where: { id },
      data: {
        nome: data.nome,
        preco: data.preco ? parseFloat(data.preco) : undefined,
        duracao: data.duracao ? parseInt(data.duracao, 10) : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }
}
