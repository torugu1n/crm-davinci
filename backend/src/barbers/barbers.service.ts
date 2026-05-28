import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BarbersService {
  constructor(private prisma: PrismaService) {}

  private async checkBarberTenant(id: string, tenantId?: string) {
    if (!tenantId) return;
    const barber = await this.prisma.barber.findFirst({
      where: {
        id,
        user: { tenantId }
      }
    });
    if (!barber) {
      throw new NotFoundException('Profissional não encontrado neste estabelecimento');
    }
  }

  async findAll(tenantId?: string) {
    return this.prisma.barber.findMany({
      where: tenantId ? { user: { tenantId } } : undefined,
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            role: true,
            roles: true,
            tenantId: true,
          },
        },
      },
      orderBy: {
        user: {
          nome: 'asc',
        },
      },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const barber = await this.prisma.barber.findFirst({
      where: {
        id,
        user: tenantId ? { tenantId } : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            role: true,
            roles: true,
            tenantId: true,
          },
        },
      },
    });
    if (!barber) throw new NotFoundException('Barbeiro não encontrado');
    return barber;
  }

  async create(data: any, tenantId?: string) {
    if (!data.nome || !data.email || !data.senha || !data.especialidade) {
      throw new BadRequestException('Nome, e-mail, senha e especialidade são obrigatórios');
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);

    return this.prisma.barber.create({
      data: {
        categoria: data.categoria || 'BARBER',
        especialidade: data.especialidade,
        miniBio: data.miniBio || null,
        fotoUrl: data.fotoUrl || null,
        commissionRate: data.commissionRate ?? 50,
        user: {
          create: {
            nome: data.nome,
            email: data.email,
            senha: senhaHash,
            role: 'BARBER',
            roles: ['BARBER'],
            tenantId: tenantId || null,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            roles: true,
            tenantId: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any, tenantId?: string) {
    const existing = await this.prisma.barber.findFirst({
      where: {
        id,
        user: tenantId ? { tenantId } : undefined,
      },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException('Profissional não encontrado');
    }

    const userData: Record<string, any> = {
      nome: data.nome,
      email: data.email,
    };

    if (data.senha) {
      userData.senha = await bcrypt.hash(data.senha, 10);
    }

    return this.prisma.barber.update({
      where: { id },
      data: {
        categoria: data.categoria,
        especialidade: data.especialidade,
        miniBio: data.miniBio !== undefined ? data.miniBio || null : undefined,
        fotoUrl: data.fotoUrl !== undefined ? data.fotoUrl || null : undefined,
        commissionRate: data.commissionRate,
        user: {
          update: userData,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            roles: true,
            tenantId: true,
          },
        },
      },
    });
  }

  async updateProfile(id: string, data: { miniBio?: string; fotoUrl?: string; especialidade?: string }, tenantId?: string) {
    await this.checkBarberTenant(id, tenantId);

    return this.prisma.barber.update({
      where: { id },
      data: {
        miniBio: data.miniBio !== undefined ? data.miniBio || null : undefined,
        fotoUrl: data.fotoUrl !== undefined ? data.fotoUrl || null : undefined,
        especialidade: data.especialidade !== undefined ? data.especialidade : undefined,
      },
    });
  }

  async delete(id: string, tenantId?: string) {
    const existing = await this.prisma.barber.findFirst({
      where: {
        id,
        user: tenantId ? { tenantId } : undefined,
      },
    });

    if (!existing) {
      throw new NotFoundException('Profissional não encontrado');
    }

    await this.prisma.user.delete({
      where: { id: existing.userId },
    });

    return { success: true };
  }

  async getBarberDashboard(id: string, tenantId?: string) {
    const barber = await this.prisma.barber.findFirst({
      where: {
        id,
        user: tenantId ? { tenantId } : undefined,
      },
      include: {
        user: true,
      },
    });

    if (!barber) throw new NotFoundException('Barbeiro não encontrado');

    // 1. Obter agenda de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const agendaHoje = await this.prisma.appointment.findMany({
      where: {
        barberId: id,
        tenantId: tenantId || undefined,
        data: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        client: true,
        service: true,
      },
      orderBy: { data: 'asc' },
    });

    // 2. Métricas de desempenho
    const allCompleted = await this.prisma.appointment.findMany({
      where: { 
        barberId: id, 
        status: 'COMPLETED',
        tenantId: tenantId || undefined,
      },
      include: { client: true },
    });

    const totalCortes = allCompleted.length;
    const faturamentoTotal = allCompleted.reduce((sum, app) => sum + app.valor, 0);

    // Calcular taxa de retorno (clientes recorrentes atendidos)
    const recurringClientsCount = allCompleted.filter((app) => app.client.frequency > 1).length;
    const taxaRetorno = allCompleted.length > 0 ? (recurringClientsCount / allCompleted.length) * 100 : 0;

    return {
      barber: {
        id: barber.id,
        nome: barber.user.nome,
        categoria: barber.categoria,
        especialidade: barber.especialidade,
        miniBio: barber.miniBio,
        fotoUrl: barber.fotoUrl,
        commissionRate: barber.commissionRate,
        notaMedia: barber.notaMedia,
      },
      todayAppointments: agendaHoje,
      metrics: {
        totalAppointments: totalCortes,
        totalBilling: faturamentoTotal,
        returnRate: parseFloat(taxaRetorno.toFixed(1)),
        commissionRate: barber.commissionRate,
        commissionEarned: faturamentoTotal * (barber.commissionRate / 100),
      },
    };
  }

  async getAllBlocks(tenantId?: string) {
    return this.prisma.agendaBlock.findMany({
      where: tenantId ? { barber: { user: { tenantId } } } : undefined,
      orderBy: { dataInicio: 'asc' },
    });
  }

  async getSchedule(barberId: string, tenantId?: string) {
    await this.checkBarberTenant(barberId, tenantId);
    return this.prisma.workSchedule.findMany({
      where: { barberId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async updateSchedule(barberId: string, schedules: any[], tenantId?: string) {
    await this.checkBarberTenant(barberId, tenantId);
    const results = [];
    for (const item of schedules) {
      const res = await this.prisma.workSchedule.upsert({
        where: {
          barberId_dayOfWeek: {
            barberId,
            dayOfWeek: Number(item.dayOfWeek),
          },
        },
        update: {
          startTime: item.startTime,
          endTime: item.endTime,
          breakStart: item.breakStart,
          breakEnd: item.breakEnd,
          active: item.active,
        },
        create: {
          barberId,
          dayOfWeek: Number(item.dayOfWeek),
          startTime: item.startTime,
          endTime: item.endTime,
          breakStart: item.breakStart,
          breakEnd: item.breakEnd,
          active: item.active,
        },
      });
      results.push(res);
    }
    return results;
  }

  async getBlocks(barberId: string, tenantId?: string) {
    await this.checkBarberTenant(barberId, tenantId);
    return this.prisma.agendaBlock.findMany({
      where: { barberId },
      orderBy: { dataInicio: 'asc' },
    });
  }

  async createBlock(barberId: string, body: { titulo: string; dataInicio: string; dataFim: string }, tenantId?: string) {
    await this.checkBarberTenant(barberId, tenantId);
    return this.prisma.agendaBlock.create({
      data: {
        barberId,
        titulo: body.titulo,
        dataInicio: new Date(body.dataInicio),
        dataFim: new Date(body.dataFim),
      },
    });
  }

  async deleteBlock(id: string, tenantId?: string, currentUser?: any) {
    const block = await this.prisma.agendaBlock.findUnique({ 
      where: { id },
      include: { barber: { include: { user: true } } }
    });
    if (!block || (tenantId && block.barber.user.tenantId !== tenantId)) {
      throw new NotFoundException('Bloqueio não encontrado');
    }
    const isAdminOrSuper = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('SUPER_ADMIN');
    if (!isAdminOrSuper && currentUser?.barberId !== block.barberId) {
      throw new NotFoundException('Bloqueio não encontrado');
    }
    return this.prisma.agendaBlock.delete({ where: { id } });
  }
}
