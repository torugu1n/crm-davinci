import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            service: true,
            barber: { include: { user: true } },
            feedback: true,
          },
          orderBy: { data: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return client;
  }

  async create(data: any) {
    const cleanedPhone = data.telefone.replace(/\D/g, '');
    return this.prisma.client.create({
      data: {
        nome: data.nome,
        telefone: cleanedPhone,
        aniversario: data.aniversario,
        observacoes: data.observacoes,
        preferences: data.preferences,
      },
    });
  }

  async update(id: string, data: any) {
    const cleanedPhone = data.telefone ? data.telefone.replace(/\D/g, '') : undefined;
    return this.prisma.client.update({
      where: { id },
      data: {
        nome: data.nome,
        telefone: cleanedPhone,
        aniversario: data.aniversario,
        observacoes: data.observacoes,
        preferences: data.preferences,
        frequency: data.frequency,
        ticketMedio: data.ticketMedio,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.client.delete({ where: { id } });
  }
}
