import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getFinanceSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Faturamento diário
    const dailyAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        data: { gte: today },
      },
    });
    const faturamentoDiario = dailyAppointments.reduce((sum, a) => sum + a.valor, 0);

    // 2. Faturamento semanal
    const weeklyAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        data: { gte: startOfWeek },
      },
    });
    const faturamentoSemanal = weeklyAppointments.reduce((sum, a) => sum + a.valor, 0);

    // 3. Faturamento mensal
    const monthlyAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        data: { gte: startOfMonth },
      },
      include: {
        barber: {
          include: {
            serviceCommissions: true,
          },
        },
      },
    });
    const faturamentoMensal = monthlyAppointments.reduce((sum, a) => sum + a.valor, 0);

    // 4. Comissões (soma dinâmica com base em taxas customizadas por serviço ou padrão do barbeiro)
    const comissaoMensal = monthlyAppointments.reduce((sum, a) => {
      const customComm = a.barber.serviceCommissions.find(
        (sc: any) => sc.serviceId === a.serviceId
      );
      const rate = customComm ? customComm.commissionRate : a.barber.commissionRate;
      return sum + a.valor * (rate / 100);
    }, 0);

    // 5. Metas (Faturamento mensal meta: buscar do banco ou usar padrão 15.000,00)
    const activeGoal = await this.prisma.goal.findFirst({
      where: {
        tipo: 'BILLING',
        dataInicio: { lte: today },
        dataFim: { gte: today },
      },
    });
    const metaMensal = activeGoal ? activeGoal.valorAlvo : 15000.0;
    const progressoMeta = metaMensal > 0 ? (faturamentoMensal / metaMensal) * 100 : 0;

    // 6. Ranking de Barbeiros mais lucrativos (comissões e faturamento)
    const completedAppointments = await this.prisma.appointment.findMany({
      where: { status: 'COMPLETED' },
      include: {
        barber: {
          include: {
            user: true,
            serviceCommissions: true,
          },
        },
      },
    });

    const rankingMap: Record<string, { nome: string; faturamento: number; comissao: number; atendimentos: number }> = {};
    for (const app of completedAppointments) {
      const barberId = app.barberId;
      const nome = app.barber.user.nome;
      if (!rankingMap[barberId]) {
        rankingMap[barberId] = { nome, faturamento: 0, comissao: 0, atendimentos: 0 };
      }
      
      const customComm = app.barber.serviceCommissions.find(
        (sc: any) => sc.serviceId === app.serviceId
      );
      const rate = customComm ? customComm.commissionRate : app.barber.commissionRate;
      const appCommission = app.valor * (rate / 100);

      rankingMap[barberId].faturamento += app.valor;
      rankingMap[barberId].comissao += appCommission;
      rankingMap[barberId].atendimentos += 1;
    }

    const ranking = Object.values(rankingMap).sort((a, b) => b.faturamento - a.faturamento);

    return {
      dailyBilling: faturamentoDiario,
      weeklyBilling: faturamentoSemanal,
      monthlyBilling: faturamentoMensal,
      monthlyCommissions: comissaoMensal,
      monthlyGoal: metaMensal,
      goalProgress: parseFloat(progressoMeta.toFixed(1)),
      barberRanking: ranking,
    };
  }

  async getGoals() {
    const goals = await this.prisma.goal.findMany({
      orderBy: { dataInicio: 'desc' },
    });

    const updatedGoals = await Promise.all(
      goals.map(async (goal) => {
        const appointments = await this.prisma.appointment.findMany({
          where: {
            status: 'COMPLETED',
            data: {
              gte: goal.dataInicio,
              lte: goal.dataFim,
            },
          },
        });

        let valorAtual = 0;
        if (goal.tipo === 'BILLING') {
          valorAtual = appointments.reduce((sum, a) => sum + a.valor, 0);
        } else if (goal.tipo === 'SERVICES') {
          valorAtual = appointments.length;
        }

        return this.prisma.goal.update({
          where: { id: goal.id },
          data: { valorAtual },
        });
      }),
    );

    return updatedGoals;
  }

  async createGoal(data: any) {
    return this.prisma.goal.create({
      data: {
        titulo: data.titulo,
        tipo: data.tipo,
        valorAlvo: parseFloat(data.valorAlvo),
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
      },
    });
  }

  async updateGoal(id: string, data: any) {
    return this.prisma.goal.update({
      where: { id },
      data: {
        titulo: data.titulo,
        tipo: data.tipo,
        valorAlvo: data.valorAlvo ? parseFloat(data.valorAlvo) : undefined,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
        dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
      },
    });
  }

  async deleteGoal(id: string) {
    return this.prisma.goal.delete({
      where: { id },
    });
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
