import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
    private whatsappService: WhatsappService,
  ) {}

  async findAll(currentUser: any, tenantId?: string) {
    const isClient = currentUser.role === 'CLIENT';
    const appointments = await this.prisma.appointment.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        client: !isClient,
        barber: { include: { user: true } },
        service: true,
        feedback: !isClient,
      },
      orderBy: { data: 'asc' },
    });

    if (isClient) {
      return appointments.map((app) => {
        if (app.clientId === currentUser.id) {
          return app;
        }
        return {
          id: app.id,
          clientId: '',
          barberId: app.barberId,
          serviceId: app.serviceId,
          data: app.data,
          status: app.status,
          valor: 0,
          createdAt: app.createdAt,
          barber: app.barber,
          service: app.service,
        };
      });
    }

    return appointments;
  }

  async findOne(id: string, currentUser: any, tenantId?: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { 
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
      include: {
        client: true,
        barber: { include: { user: true } },
        service: true,
        feedback: true,
      },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');

    const isClient = currentUser.role === 'CLIENT';
    if (isClient && appointment.clientId !== currentUser.id) {
      throw new ForbiddenException('Você não tem permissão para visualizar o agendamento de outro cliente.');
    }

    return appointment;
  }

  async create(data: any, currentUser: any, tenantId?: string) {
    const isClient = currentUser.role === 'CLIENT';
    const clientId = isClient ? currentUser.id : data.clientId;
    if (!clientId) throw new BadRequestException('ID do cliente é obrigatório');
    if (!data.barberId) throw new BadRequestException('ID do profissional é obrigatório');
    if (!data.serviceId) throw new BadRequestException('ID do serviço é obrigatório');

    const [service, barber] = await Promise.all([
      this.prisma.service.findFirst({ 
        where: { 
          id: data.serviceId,
          tenantId: tenantId ? tenantId : undefined,
        } 
      }),
      this.prisma.barber.findFirst({ 
        where: { 
          id: data.barberId,
          user: tenantId ? { tenantId } : undefined,
        } 
      }),
    ]);
    if (!service) throw new NotFoundException('Serviço não encontrado');
    if (!barber) throw new NotFoundException('Profissional não encontrado');

    const isAdminOrSuper = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.roles?.includes('ADMIN') || currentUser.roles?.includes('SUPER_ADMIN');
    const valor = (isAdminOrSuper && data.valor !== undefined) ? parseFloat(data.valor) : service.preco;

    const appointment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          clientId,
          barberId: data.barberId,
          serviceId: data.serviceId,
          data: new Date(data.data),
          status: data.status || 'SCHEDULED',
          valor,
          tenantId: tenantId || null,
        },
        include: {
          client: true,
          barber: { include: { user: true } },
          service: true,
        },
      });

      await tx.barber.update({
        where: { id: data.barberId },
        data: {
          services: {
            connect: { id: data.serviceId },
          },
        },
      });

      await tx.client.update({
        where: { id: clientId },
        data: {
          assignedBarberId: data.barberId,
        },
      });

      return created;
    });

    this.wsGateway.broadcast('appointment-created', appointment);
    return appointment;
  }

  async update(id: string, data: any, currentUser: any, tenantId?: string) {
    const existing = await this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
      include: {
        client: true,
        service: true,
        barber: { include: { user: true } },
      },
    });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    const isClient = currentUser.role === 'CLIENT';
    const isAdminOrSuper = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.roles?.includes('ADMIN') || currentUser.roles?.includes('SUPER_ADMIN');

    if (isClient && existing.clientId !== currentUser.id) {
      throw new ForbiddenException('Você não tem permissão para alterar o agendamento de outro cliente.');
    }

    let finalStatus = data.status;
    if (isClient && data.status && data.status !== 'CANCELLED' && data.status !== existing.status) {
      throw new ForbiddenException('Clientes só podem alterar o status de agendamento para CANCELLED.');
    }

    let finalValor = existing.valor;
    if (data.serviceId && data.serviceId !== existing.serviceId) {
      const newService = await this.prisma.service.findFirst({ 
        where: { 
          id: data.serviceId,
          tenantId: tenantId ? tenantId : undefined,
        } 
      });
      if (!newService) throw new NotFoundException('Novo serviço não encontrado');
      finalValor = newService.preco;
    }

    if (data.valor !== undefined && parseFloat(data.valor) !== finalValor) {
      if (!isAdminOrSuper) {
        throw new ForbiddenException('Apenas administradores podem definir valores customizados de pagamento.');
      } else {
        finalValor = parseFloat(data.valor);
      }
    }

    // Log price changes
    if (finalValor !== existing.valor) {
      await this.prisma.auditLog.create({
        data: {
          usuario: currentUser.nome || currentUser.email || 'Sistema',
          acao: 'CHANGE_APPOINTMENT_PRICE',
          detalhes: `Valor do agendamento de ${existing.client.nome} (${existing.service.nome}) em ${new Date(existing.data).toLocaleString('pt-BR')} alterado de R$ ${existing.valor} para R$ ${finalValor}.`,
          tenantId: tenantId || null,
        },
      });
    }

    // Log status cancellation
    if (finalStatus === 'CANCELLED' && existing.status !== 'CANCELLED') {
      await this.prisma.auditLog.create({
        data: {
          usuario: currentUser.nome || currentUser.email || 'Sistema',
          acao: 'CANCEL_APPOINTMENT',
          detalhes: `Agendamento do cliente ${existing.client.nome} com o profissional ${existing.barber.user.nome} em ${new Date(existing.data).toLocaleString('pt-BR')} foi cancelado.`,
          tenantId: tenantId || null,
        },
      });
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        barberId: data.barberId,
        serviceId: data.serviceId,
        data: data.data ? new Date(data.data) : undefined,
        status: finalStatus,
        valor: finalValor,
      },
      include: {
        client: true,
        barber: { include: { user: true } },
        service: true,
        feedback: true,
      },
    });

    // Se o status mudou para COMPLETED, processa estatísticas e envia feedback simulado
    if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await this.processCompletion(updated, tenantId);
    }

    this.wsGateway.broadcast('appointment-updated', updated);
    return updated;
  }

  private async processCompletion(appointment: any, tenantId?: string) {
    const clientId = appointment.clientId;

    // 1. Obter todos agendamentos finalizados do cliente
    const completed = await this.prisma.appointment.findMany({
      where: { clientId, status: 'COMPLETED', tenantId: tenantId || undefined },
    });

    const frequency = completed.length;
    const totalSpent = completed.reduce((sum, app) => sum + app.valor, 0);
    const ticketMedio = frequency > 0 ? totalSpent / frequency : 0;

    // 2. Atualizar o cliente no CRM
    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        frequency,
        ticketMedio,
      },
    });

    // 3. Obter tempo de atraso (delay) do ambiente
    const delayMs = parseInt(process.env.FEEDBACK_DELAY_MS || '10000', 10);

    // Enviar notificação imediata de conclusão no dashboard
    this.wsGateway.broadcast('dashboard-notification', {
      title: 'Atendimento Concluído',
      description: `O profissional ${appointment.barber.user.nome} finalizou o atendimento de ${appointment.client.nome}. Feedback será solicitado em breve.`,
      type: 'success',
      timestamp: new Date(),
    });

    // 4. Enviar mensagem de feedback simulada via WhatsApp com atraso (delay)
    setTimeout(async () => {
      try {
        const messageContent = `Olá, ${appointment.client.nome}! Como foi sua experiência hoje? Deixe sua avaliação em: http://localhost:3000/feedback/${appointment.id}`;
        
        await this.whatsappService.sendOperatorMessage(clientId, messageContent);

        // Enviar notificação geral de feedback solicitado no dashboard
        this.wsGateway.broadcast('dashboard-notification', {
          title: 'Feedback Solicitado',
          description: `Mensagem de feedback enviada via WhatsApp para ${appointment.client.nome}.`,
          type: 'info',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Erro ao processar e enviar mensagem de feedback agendada:', error);
      }
    }, delayMs);
  }

  async delete(id: string, currentUser?: any, tenantId?: string) {
    const existing = await this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
      include: {
        client: true,
        service: true,
        barber: { include: { user: true } },
      },
    });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    await this.prisma.auditLog.create({
      data: {
        usuario: currentUser?.nome || currentUser?.email || 'Sistema',
        acao: 'DELETE_APPOINTMENT',
        detalhes: `Agendamento de ${existing.client.nome} (${existing.service.nome}) com ${existing.barber.user.nome} marcado para ${new Date(existing.data).toLocaleString('pt-BR')} foi excluído.`,
        tenantId: tenantId || null,
      },
    });

    const deleted = await this.prisma.appointment.delete({ where: { id } });
    this.wsGateway.broadcast('appointment-deleted', { id });
    return deleted;
  }
}
