import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class FeedbacksService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
  ) {}

  async findAll() {
    return this.prisma.feedback.findMany({
      include: {
        appointment: {
          include: {
            client: true,
            barber: { include: { user: true } },
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    const { appointmentId, nota, comentario, ratingBarber, ratingEnv, ratingPunctual } = data;

    const app = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, barber: { include: { user: true } } },
    });
    if (!app) throw new NotFoundException('Agendamento não encontrado');

    const existing = await this.prisma.feedback.findUnique({
      where: { appointmentId },
    });
    if (existing) throw new BadRequestException('Feedback já enviado para este agendamento');

    const feedback = await this.prisma.feedback.create({
      data: {
        appointmentId,
        nota: parseInt(nota, 10),
        comentario,
        ratingBarber: ratingBarber ? parseInt(ratingBarber, 10) : 5,
        ratingEnv: ratingEnv ? parseInt(ratingEnv, 10) : 5,
        ratingPunctual: ratingPunctual ? String(ratingPunctual) : '5',
      },
    });

    // Recalcular a média de nota do barbeiro
    const feedbacksBarbeiro = await this.prisma.feedback.findMany({
      where: {
        appointment: {
          barberId: app.barberId,
        },
      },
    });

    const totalNotas = feedbacksBarbeiro.reduce((sum, f) => sum + f.ratingBarber, 0);
    const notaMedia = feedbacksBarbeiro.length > 0 ? totalNotas / feedbacksBarbeiro.length : 5.0;

    await this.prisma.barber.update({
      where: { id: app.barberId },
      data: {
        notaMedia: parseFloat(notaMedia.toFixed(2)),
      },
    });

    // Notificar admin no dashboard em tempo real
    this.wsGateway.broadcast('dashboard-notification', {
      title: 'Novo Feedback Recebido',
      description: `O cliente ${app.client.nome} avaliou o atendimento de ${app.barber.user.nome} com nota ${ratingBarber}/5.`,
      type: 'info',
      timestamp: new Date(),
    });

    return feedback;
  }
}
