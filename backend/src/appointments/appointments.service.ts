import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findAll() {
    return this.prisma.appointment.findMany({
      include: {
        client: true,
        barber: { include: { user: true } },
        service: true,
        feedback: true,
      },
      orderBy: { data: 'asc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        barber: { include: { user: true } },
        service: true,
        feedback: true,
      },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async create(data: any) {
    const service = await this.prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    const appointment = await this.prisma.appointment.create({
      data: {
        clientId: data.clientId,
        barberId: data.barberId,
        serviceId: data.serviceId,
        data: new Date(data.data),
        status: data.status || 'SCHEDULED',
        valor: service.preco,
      },
      include: {
        client: true,
        barber: { include: { user: true } },
        service: true,
      },
    });

    this.wsGateway.broadcast('appointment-created', appointment);
    return appointment;
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        barberId: data.barberId,
        serviceId: data.serviceId,
        data: data.data ? new Date(data.data) : undefined,
        status: data.status,
        valor: data.valor,
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
      await this.processCompletion(updated);
    }

    this.wsGateway.broadcast('appointment-updated', updated);
    return updated;
  }

  private async processCompletion(appointment: any) {
    const clientId = appointment.clientId;

    // 1. Obter todos agendamentos finalizados do cliente
    const completed = await this.prisma.appointment.findMany({
      where: { clientId, status: 'COMPLETED' },
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

  async delete(id: string) {
    const deleted = await this.prisma.appointment.delete({ where: { id } });
    this.wsGateway.broadcast('appointment-deleted', { id });
    return deleted;
  }
}
