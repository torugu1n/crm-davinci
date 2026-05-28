import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { normalizeBirthday, normalizePhone } from './client-formatters';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId?: string) {
    return this.prisma.client.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        assignedBarber: {
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                role: true,
                roles: true,
              },
            },
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const client = await this.prisma.client.findFirst({
      where: { 
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
      include: {
        assignedBarber: {
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                role: true,
                roles: true,
              },
            },
          },
        },
        appointments: {
          include: {
            service: true,
            barber: {
              include: {
                user: {
                  select: {
                    id: true,
                    nome: true,
                    role: true,
                    roles: true,
                  },
                },
              },
            },
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

  async create(data: any, tenantId?: string) {
    return this.prisma.client.create({
      data: {
        nome: data.nome,
        telefone: normalizePhone(data.telefone),
        email: data.email || null,
        aniversario: data.aniversario ? normalizeBirthday(data.aniversario) : null,
        observacoes: data.observacoes,
        preferences: data.preferences,
        tags: data.tags || [],
        assignedBarberId: data.assignedBarberId || null,
        tenantId: tenantId || null,
      },
    });
  }

  async update(id: string, data: any, tenantId?: string, currentUser?: any) {
    await this.findOne(id, tenantId); // verify exists and belongs to tenant
    const isClient = currentUser?.role === 'CLIENT';

    return this.prisma.client.update({
      where: { id },
      data: {
        nome: data.nome,
        telefone: data.telefone ? normalizePhone(data.telefone) : undefined,
        email: data.email !== undefined ? data.email : undefined,
        aniversario: data.aniversario !== undefined ? (data.aniversario ? normalizeBirthday(data.aniversario) : null) : undefined,
        observacoes: !isClient && data.observacoes !== undefined ? data.observacoes : undefined,
        preferences: data.preferences !== undefined ? data.preferences : undefined,
        frequency: !isClient && data.frequency !== undefined ? data.frequency : undefined,
        ticketMedio: !isClient && data.ticketMedio !== undefined ? data.ticketMedio : undefined,
        chatStatus: !isClient && data.chatStatus !== undefined ? data.chatStatus : undefined,
        origem: !isClient && data.origem !== undefined ? data.origem : undefined,
        tags: !isClient && data.tags !== undefined ? data.tags : undefined,
        assignedBarberId: !isClient && data.assignedBarberId !== undefined ? data.assignedBarberId : undefined,
      },
    });
  }

  async delete(id: string, tenantId?: string) {
    await this.findOne(id, tenantId); // verify exists and belongs to tenant
    return this.prisma.client.delete({ where: { id } });
  }
}
