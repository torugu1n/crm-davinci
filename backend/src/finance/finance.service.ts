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
    });
    const faturamentoMensal = monthlyAppointments.reduce((sum, a) => sum + a.valor, 0);

    // 4. Comissões (50% do mensal)
    const comissaoMensal = faturamentoMensal * 0.5;

    // 5. Metas (Faturamento mensal meta: 15.000,00)
    const metaMensal = 15000.0;
    const progressoMeta = metaMensal > 0 ? (faturamentoMensal / metaMensal) * 100 : 0;

    // 6. Ranking de Barbeiros mais lucrativos (comissões e faturamento)
    const completedAppointments = await this.prisma.appointment.findMany({
      where: { status: 'COMPLETED' },
      include: {
        barber: {
          include: { user: true },
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
      rankingMap[barberId].faturamento += app.valor;
      rankingMap[barberId].comissao += app.valor * 0.5;
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
}
