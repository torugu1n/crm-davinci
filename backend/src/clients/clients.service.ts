import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(data: any, tenantId?: string, currentUser?: any) {
    if (!data.telefone) {
      throw new BadRequestException('Telefone é obrigatório');
    }

    const formattedPhone = normalizePhone(data.telefone);

    // Prevent database crash from global unique constraint
    const existing = await this.prisma.client.findFirst({
      where: { telefone: formattedPhone }
    });
    if (existing) {
      throw new BadRequestException('Este número de telefone já está cadastrado para outro cliente.');
    }

    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (tenant) {
        const clientCount = await this.prisma.client.count({
          where: { tenantId },
        });
        if (clientCount >= tenant.saasPlanLimitClients) {
          throw new BadRequestException(
            `Limite de clientes atingido para o seu plano (${tenant.saasPlanLimitClients}). Faça upgrade para o plano Absoluto para poder cadastrar mais clientes.`
          );
        }
      }
    }

    const created = await this.prisma.client.create({
      data: {
        nome: data.nome,
        telefone: formattedPhone,
        email: data.email || null,
        aniversario: data.aniversario ? normalizeBirthday(data.aniversario) : null,
        observacoes: data.observacoes,
        preferences: data.preferences,
        tags: data.tags || [],
        assignedBarberId: data.assignedBarberId || null,
        chatbotEnabled: data.chatbotEnabled !== undefined ? data.chatbotEnabled : undefined,
        tenantId: tenantId || null,
      },
    });

    // Create Audit Log
    const creatorName = currentUser?.nome || currentUser?.email || 'Sistema';
    await this.prisma.auditLog.create({
      data: {
        usuario: creatorName,
        acao: 'CREATE_CLIENT',
        detalhes: `Cliente ${created.nome} (${created.telefone}) cadastrado no estabelecimento.`,
        tenantId: tenantId || null,
      }
    });

    return created;
  }

  async update(id: string, data: any, tenantId?: string, currentUser?: any) {
    const original = await this.findOne(id, tenantId); // verify exists and belongs to tenant
    const isClient = currentUser?.role === 'CLIENT';

    let formattedPhone = undefined;
    if (data.telefone) {
      formattedPhone = normalizePhone(data.telefone);
      // Check if phone number is already in use by another client globally
      const existing = await this.prisma.client.findFirst({
        where: {
          telefone: formattedPhone,
          id: { not: id }
        }
      });
      if (existing) {
        throw new BadRequestException('Este número de telefone já está cadastrado para outro cliente.');
      }
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        nome: data.nome,
        telefone: formattedPhone,
        email: data.email !== undefined ? data.email : undefined,
        aniversario: data.aniversario !== undefined ? (data.aniversario ? normalizeBirthday(data.aniversario) : null) : undefined,
        observacoes: !isClient && data.observacoes !== undefined ? data.observacoes : undefined,
        preferences: data.preferences !== undefined ? data.preferences : undefined,
        frequency: !isClient && data.frequency !== undefined ? data.frequency : undefined,
        ticketMedio: !isClient && data.ticketMedio !== undefined ? data.ticketMedio : undefined,
        chatStatus: !isClient && data.chatStatus !== undefined ? data.chatStatus : undefined,
        chatbotEnabled: data.chatbotEnabled !== undefined ? data.chatbotEnabled : undefined,
        origem: !isClient && data.origem !== undefined ? data.origem : undefined,
        tags: !isClient && data.tags !== undefined ? data.tags : undefined,
        assignedBarberId: !isClient && data.assignedBarberId !== undefined ? data.assignedBarberId : undefined,
      },
    });

    // Create Audit Log
    const updaterName = currentUser?.nome || currentUser?.email || 'Sistema';
    const detailList = [];
    if (data.nome && original.nome !== data.nome) detailList.push(`nome ("${original.nome}" -> "${data.nome}")`);
    if (formattedPhone && original.telefone !== formattedPhone) detailList.push(`telefone ("${original.telefone}" -> "${formattedPhone}")`);
    
    await this.prisma.auditLog.create({
      data: {
        usuario: updaterName,
        acao: 'UPDATE_CLIENT',
        detalhes: `Cliente ${updated.nome} (${updated.telefone}) teve seus dados atualizados${detailList.length ? `: ${detailList.join(', ')}` : ''}.`,
        tenantId: tenantId || null,
      }
    });

    return updated;
  }

  async delete(id: string, tenantId?: string, currentUser?: any) {
    const client = await this.findOne(id, tenantId); // verify exists and belongs to tenant
    const deleted = await this.prisma.client.delete({ where: { id } });

    // Create Audit Log
    const deleterName = currentUser?.nome || currentUser?.email || 'Sistema';
    await this.prisma.auditLog.create({
      data: {
        usuario: deleterName,
        acao: 'DELETE_CLIENT',
        detalhes: `Cliente ${client.nome} (${client.telefone}) foi excluído permanentemente do sistema (LGPD/Exclusão manual).`,
        tenantId: tenantId || null,
      }
    });

    return deleted;
  }
}
