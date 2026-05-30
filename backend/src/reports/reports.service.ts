import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Helper to generate an array of Date objects for each day in a range
  private getDatesInRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    const targetEnd = new Date(end);
    targetEnd.setHours(0, 0, 0, 0);

    while (current <= targetEnd) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // Format a date to YYYY-MM-DD in local time
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getFinancialReport(tenantId: string, startStr?: string, endStr?: string) {
    const endDate = endStr ? new Date(endStr) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = startStr ? new Date(startStr) : new Date();
    if (!startStr) {
      startDate.setDate(endDate.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    // Fetch all completed appointments in the range
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        data: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        barber: {
          include: {
            user: { select: { nome: true } },
            serviceCommissions: true,
          },
        },
        service: { select: { nome: true } },
      },
      orderBy: { data: 'asc' },
    });

    // 1. Core KPIs
    const totalRevenue = appointments.reduce((sum, app) => sum + app.valor, 0);
    const appointmentsCount = appointments.length;
    const ticketMedio = appointmentsCount > 0 ? totalRevenue / appointmentsCount : 0;

    // Calculate commissions dynamically
    let totalCommissions = 0;
    const barberRevenueMap: Record<string, { name: string; revenue: number; commission: number; count: number }> = {};
    const serviceRevenueMap: Record<string, { name: string; revenue: number; count: number }> = {};

    for (const app of appointments) {
      const barberId = app.barberId;
      const barberName = app.barber.user.nome;
      const serviceId = app.serviceId;
      const serviceName = app.service.nome;

      // Commission rate lookup
      const customComm = app.barber.serviceCommissions.find((sc) => sc.serviceId === serviceId);
      const rate = customComm ? customComm.commissionRate : app.barber.commissionRate;
      const appCommission = app.valor * (rate / 100);
      totalCommissions += appCommission;

      // Group by barber
      if (!barberRevenueMap[barberId]) {
        barberRevenueMap[barberId] = { name: barberName, revenue: 0, commission: 0, count: 0 };
      }
      barberRevenueMap[barberId].revenue += app.valor;
      barberRevenueMap[barberId].commission += appCommission;
      barberRevenueMap[barberId].count += 1;

      // Group by service
      if (!serviceRevenueMap[serviceId]) {
        serviceRevenueMap[serviceId] = { name: serviceName, revenue: 0, count: 0 };
      }
      serviceRevenueMap[serviceId].revenue += app.valor;
      serviceRevenueMap[serviceId].count += 1;
    }

    const netProfit = totalRevenue - totalCommissions;

    // 2. Generate daily trend
    const dates = this.getDatesInRange(startDate, endDate);
    const dailyTrendMap: Record<string, { date: string; revenue: number; commissions: number; count: number }> = {};

    for (const date of dates) {
      const key = this.formatDate(date);
      dailyTrendMap[key] = { date: key, revenue: 0, commissions: 0, count: 0 };
    }

    for (const app of appointments) {
      const key = this.formatDate(app.data);
      if (dailyTrendMap[key]) {
        const customComm = app.barber.serviceCommissions.find((sc) => sc.serviceId === app.serviceId);
        const rate = customComm ? customComm.commissionRate : app.barber.commissionRate;
        const appCommission = app.valor * (rate / 100);

        dailyTrendMap[key].revenue += app.valor;
        dailyTrendMap[key].commissions += appCommission;
        dailyTrendMap[key].count += 1;
      }
    }

    const dailyTrend = Object.values(dailyTrendMap);
    const revenueByBarber = Object.values(barberRevenueMap).sort((a, b) => b.revenue - a.revenue);
    const revenueByService = Object.values(serviceRevenueMap).sort((a, b) => b.revenue - a.revenue);

    return {
      kpis: {
        totalRevenue,
        totalCommissions,
        netProfit,
        appointmentsCount,
        ticketMedio,
      },
      dailyTrend,
      revenueByBarber,
      revenueByService,
    };
  }

  async getAppointmentsReport(tenantId: string, startStr?: string, endStr?: string) {
    const endDate = endStr ? new Date(endStr) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = startStr ? new Date(startStr) : new Date();
    if (!startStr) {
      startDate.setDate(endDate.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    // Fetch all appointments in the range (any status)
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        data: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        barber: {
          include: { user: { select: { nome: true } } },
        },
      },
      orderBy: { data: 'asc' },
    });

    const total = appointments.length;

    // 1. Status breakdown
    const statusBreakdown = {
      SCHEDULED: 0,
      CONFIRMED: 0,
      CHECKED_IN: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    const barberAppointmentsMap: Record<string, { name: string; total: number; completed: number; cancelled: number }> = {};
    const appointmentsByDayOfWeek = Array(7).fill(0); // 0 (Sun) to 6 (Sat)
    const appointmentsByHour: Record<number, number> = {};

    for (const app of appointments) {
      const status = app.status;
      if (statusBreakdown[status] !== undefined) {
        statusBreakdown[status] += 1;
      }

      // Group by barber
      const barberId = app.barberId;
      const barberName = app.barber.user.nome;
      if (!barberAppointmentsMap[barberId]) {
        barberAppointmentsMap[barberId] = { name: barberName, total: 0, completed: 0, cancelled: 0 };
      }
      barberAppointmentsMap[barberId].total += 1;
      if (status === 'COMPLETED') barberAppointmentsMap[barberId].completed += 1;
      if (status === 'CANCELLED') barberAppointmentsMap[barberId].cancelled += 1;

      // Group by day of week (0 to 6)
      const day = app.data.getDay();
      appointmentsByDayOfWeek[day] += 1;

      // Group by hour
      const hour = app.data.getHours();
      appointmentsByHour[hour] = (appointmentsByHour[hour] || 0) + 1;
    }

    // 2. Attendance/Conversion rate: completed / (completed + cancelled)
    const completed = statusBreakdown.COMPLETED;
    const cancelled = statusBreakdown.CANCELLED;
    const resolvedAppointments = completed + cancelled;
    const attendanceRate = resolvedAppointments > 0 ? (completed / resolvedAppointments) * 100 : 0;

    // 3. Daily trends
    const dates = this.getDatesInRange(startDate, endDate);
    const dailyTrendMap: Record<string, { date: string; total: number; completed: number; cancelled: number }> = {};

    for (const date of dates) {
      const key = this.formatDate(date);
      dailyTrendMap[key] = { date: key, total: 0, completed: 0, cancelled: 0 };
    }

    for (const app of appointments) {
      const key = this.formatDate(app.data);
      if (dailyTrendMap[key]) {
        dailyTrendMap[key].total += 1;
        if (app.status === 'COMPLETED') dailyTrendMap[key].completed += 1;
        if (app.status === 'CANCELLED') dailyTrendMap[key].cancelled += 1;
      }
    }

    // Format hour breakdown to array
    const hourDistribution = Object.keys(appointmentsByHour)
      .map((hr) => ({ hour: Number(hr), count: appointmentsByHour[Number(hr)] }))
      .sort((a, b) => a.hour - b.hour);

    return {
      kpis: {
        totalAppointments: total,
        completedCount: completed,
        cancelledCount: cancelled,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
      },
      statusBreakdown,
      appointmentsByBarber: Object.values(barberAppointmentsMap),
      appointmentsByDayOfWeek,
      appointmentsByHour: hourDistribution,
      dailyTrend: Object.values(dailyTrendMap),
    };
  }

  async getClientsReport(tenantId: string, startStr?: string, endStr?: string) {
    const endDate = endStr ? new Date(endStr) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = startStr ? new Date(startStr) : new Date();
    if (!startStr) {
      startDate.setDate(endDate.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    // 1. General counts
    const totalClientsCount = await this.prisma.client.count({ where: { tenantId } });

    // 2. New clients in period
    const newClients = await this.prisma.client.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const newClientsCount = newClients.length;

    // Daily growth trend
    const dates = this.getDatesInRange(startDate, endDate);
    const dailyRegistrationsMap: Record<string, { date: string; count: number }> = {};
    for (const date of dates) {
      const key = this.formatDate(date);
      dailyRegistrationsMap[key] = { date: key, count: 0 };
    }

    for (const cli of newClients) {
      const key = this.formatDate(cli.createdAt);
      if (dailyRegistrationsMap[key]) {
        dailyRegistrationsMap[key].count += 1;
      }
    }

    // 3. VIP Clients in range (ranked by completed appointments revenue and visits)
    const completedApps = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        data: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: { select: { nome: true, telefone: true } },
      },
    });

    const vipClientsMap: Record<string, { name: string; phone: string; visits: number; spent: number }> = {};
    for (const app of completedApps) {
      const clientId = app.clientId;
      if (!vipClientsMap[clientId]) {
        vipClientsMap[clientId] = {
          name: app.client.nome,
          phone: app.client.telefone,
          visits: 0,
          spent: 0,
        };
      }
      vipClientsMap[clientId].visits += 1;
      vipClientsMap[clientId].spent += app.valor;
    }

    const vipClients = Object.values(vipClientsMap)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10); // top 10

    // 4. Client retention & recurrence
    // Active clients (at least 1 appointment in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeClientsCount = await this.prisma.client.count({
      where: {
        tenantId,
        appointments: {
          some: {
            data: { gte: thirtyDaysAgo },
            status: 'COMPLETED',
          },
        },
      },
    });

    // Frequency segmentation (overall)
    const allClients = await this.prisma.client.findMany({
      where: { tenantId },
      select: { frequency: true },
    });

    const frequencyDistribution = {
      oneVisit: 0,      // frequency = 1
      twoToFive: 0,     // frequency between 2 and 5
      sixToTen: 0,      // frequency between 6 and 10
      elevenPlus: 0,    // frequency >= 11
      zeroVisits: 0,    // frequency = 0
    };

    let totalReturning = 0;
    for (const cli of allClients) {
      const freq = cli.frequency;
      if (freq === 0) frequencyDistribution.zeroVisits += 1;
      else if (freq === 1) frequencyDistribution.oneVisit += 1;
      else if (freq >= 2 && freq <= 5) {
        frequencyDistribution.twoToFive += 1;
        totalReturning += 1;
      } else if (freq >= 6 && freq <= 10) {
        frequencyDistribution.sixToTen += 1;
        totalReturning += 1;
      } else {
        frequencyDistribution.elevenPlus += 1;
        totalReturning += 1;
      }
    }

    const totalWithVisits = allClients.length - frequencyDistribution.zeroVisits;
    const recurrenceRate = totalWithVisits > 0 ? (totalReturning / totalWithVisits) * 100 : 0;

    return {
      kpis: {
        totalClients: totalClientsCount,
        newClientsCount,
        activeClients: activeClientsCount,
        recurrenceRate: parseFloat(recurrenceRate.toFixed(1)),
      },
      dailyTrend: Object.values(dailyRegistrationsMap),
      vipClients,
      frequencyDistribution,
    };
  }
}
