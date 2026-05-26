import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BarbersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.barber.findMany({
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            roles: true,
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

  async findOne(id: string) {
    const barber = await this.prisma.barber.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            roles: true,
          },
        },
      },
    });
    if (!barber) throw new NotFoundException('Barbeiro não encontrado');
    return barber;
  }

  async create(data: any) {
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
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.barber.findUnique({
      where: { id },
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
          },
        },
      },
    });
  }

  async updateProfile(id: string, data: { miniBio?: string; fotoUrl?: string; especialidade?: string }) {
    const existing = await this.prisma.barber.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Profissional não encontrado');
    }

    return this.prisma.barber.update({
      where: { id },
      data: {
        miniBio: data.miniBio !== undefined ? data.miniBio || null : undefined,
        fotoUrl: data.fotoUrl !== undefined ? data.fotoUrl || null : undefined,
        especialidade: data.especialidade !== undefined ? data.especialidade : undefined,
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.barber.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Profissional não encontrado');
    }

    await this.prisma.user.delete({
      where: { id: existing.userId },
    });

    return { success: true };
  }

  async getBarberDashboard(id: string) {
    const barber = await this.prisma.barber.findUnique({
      where: { id },
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
      where: { barberId: id, status: 'COMPLETED' },
      include: { client: true },
    });

    const totalCortes = allCompleted.length;
    const faturamentoTotal = allCompleted.reduce((sum, app) => sum + app.valor, 0);

    // Calcular taxa de retorno (clientes recorrentes atendidos)
    const uniqueClients = new Set(allCompleted.map((app) => app.clientId));
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
}
