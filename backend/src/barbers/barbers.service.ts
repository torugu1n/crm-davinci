import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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
          },
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
          },
        },
      },
    });
    if (!barber) throw new NotFoundException('Barbeiro não encontrado');
    return barber;
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
        especialidade: barber.especialidade,
        notaMedia: barber.notaMedia,
      },
      todayAppointments: agendaHoje,
      metrics: {
        totalAppointments: totalCortes,
        totalBilling: faturamentoTotal,
        returnRate: parseFloat(taxaRetorno.toFixed(1)),
        commissionEarned: faturamentoTotal * 0.5, // 50% commission
      },
    };
  }
}
