import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { verifyFeedbackToken } from './feedback-token';

const safeUserSelect = {
  id: true,
  nome: true,
  email: true,
  role: true,
  roles: true,
  tenantId: true,
};

@Injectable()
export class FeedbacksService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
  ) {}

  async findAll(tenantId?: string) {
    return this.prisma.feedback.findMany({
      where: tenantId ? { appointment: { tenantId } } : undefined,
      include: {
        appointment: {
          include: {
            client: true,
            barber: { include: { user: { select: safeUserSelect } } },
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublicAppointment(appointmentId: string, token: string) {
    verifyFeedbackToken(token, appointmentId);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        status: true,
        data: true,
        feedback: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        service: {
          select: {
            nome: true,
          },
        },
        barber: {
          select: {
            user: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async create(data: any, tenantId?: string) {
    const { appointmentId, feedbackToken, nota, comentario, ratingBarber, ratingEnv, ratingPunctual } = data;
    verifyFeedbackToken(feedbackToken, appointmentId);

    const app = await this.prisma.appointment.findFirst({
      where: { 
        id: appointmentId,
        tenantId: tenantId ? tenantId : undefined,
      },
      include: { client: true, barber: { include: { user: { select: safeUserSelect } } } },
    });
    if (!app) throw new NotFoundException('Agendamento não encontrado');
    if (app.status !== 'COMPLETED') {
      throw new BadRequestException('Feedback disponível apenas para agendamentos concluídos');
    }

    const existing = await this.prisma.feedback.findUnique({
      where: { appointmentId },
    });
    if (existing) throw new BadRequestException('Feedback já enviado para este agendamento');

    const parsedNota = parseInt(nota, 10);
    const parsedRatingBarber = ratingBarber ? parseInt(ratingBarber, 10) : 5;
    const parsedRatingEnv = ratingEnv ? parseInt(ratingEnv, 10) : 5;
    if (![parsedNota, parsedRatingBarber, parsedRatingEnv].every((value) => Number.isInteger(value) && value >= 1 && value <= 5)) {
      throw new BadRequestException('Notas devem ser números inteiros entre 1 e 5');
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        appointmentId,
        nota: parsedNota,
        comentario,
        ratingBarber: parsedRatingBarber,
        ratingEnv: parsedRatingEnv,
        ratingPunctual: ratingPunctual ? String(ratingPunctual) : '5',
      },
    });

    // Recalcular a média de nota do barbeiro
    const feedbacksBarbeiro = await this.prisma.feedback.findMany({
      where: {
        appointment: {
          barberId: app.barberId,
          tenantId: tenantId ? tenantId : undefined,
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
      tenantId,
      title: 'Novo Feedback Recebido',
      description: `O cliente ${app.client.nome} avaliou o atendimento de ${app.barber.user.nome} com nota ${ratingBarber}/5.`,
      type: 'info',
      timestamp: new Date(),
    });

    return feedback;
  }
}
