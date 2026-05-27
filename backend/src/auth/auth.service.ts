import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { extractPhoneDigits, normalizeBirthday, normalizePhone } from '../clients/client-formatters';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private normalizeStaffIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      return normalized;
    }

    const legacyAliases: Record<string, string> = {
      barbeiro1: 'barbeiro1@salao.com',
      profissional1: 'barbeiro1@salao.com',
    };

    if (legacyAliases[normalized]) {
      return legacyAliases[normalized];
    }

    return normalized.includes('@') ? normalized : `${normalized}@salao.com`;
  }

  async validateStaff(email: string, pass: string): Promise<any> {
    const normalizedEmail = this.normalizeStaffIdentifier(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { barber: true },
    });
    if (user && user.isActive && (await bcrypt.compare(pass, user.senha))) {
      const { senha, ...result } = user;
      return result;
    }
    return null;
  }

  async staffLogin(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role, 
      roles: user.roles, 
      isActive: user.isActive,
      tenantId: user.tenantId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        roles: user.roles,
        isActive: user.isActive,
        barberId: user.barber?.id || null,
        tenantId: user.tenantId,
      },
    };
  }

  async clientLogin(nome: string, telefone: string, aniversario?: string, tenantId?: string) {
    if (!nome || !telefone) {
      throw new BadRequestException('Nome e telefone são obrigatórios');
    }

    const normalizedName = nome.trim();
    if (normalizedName.length < 2) {
      throw new BadRequestException('Informe seu nome completo');
    }

    const formattedPhone = normalizePhone(telefone);
    const cleanedPhone = extractPhoneDigits(formattedPhone);
    const normalizedBirthday = normalizeBirthday(aniversario);

    // Resolve tenant ID if not provided, try to find default "davinci" tenant
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst({
        where: { subdomain: 'davinci' }
      });
      resolvedTenantId = defaultTenant?.id || undefined;
    }

    const last8 = cleanedPhone.substring(cleanedPhone.length - 8);
    const clients = await this.prisma.client.findMany({
      where: { tenantId: resolvedTenantId }
    });
    let client = clients.find((c) => {
      const cPhoneCleaned = extractPhoneDigits(c.telefone);
      return cPhoneCleaned.endsWith(last8);
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          nome: normalizedName,
          telefone: formattedPhone,
          aniversario: normalizedBirthday,
          observacoes: 'Cliente cadastrado via portal simplificado.',
          tenantId: resolvedTenantId,
        },
      });
    } else {
      const isTempName = !client.nome || client.nome.toLowerCase().includes('aguardando');
      const nameChanged = isTempName && client.nome !== normalizedName;
      const phoneChanged = client.telefone !== formattedPhone;
      const birthdayChanged = normalizedBirthday && client.aniversario !== normalizedBirthday;

      if (nameChanged || phoneChanged || birthdayChanged) {
        client = await this.prisma.client.update({
          where: { id: client.id },
          data: {
            nome: nameChanged ? normalizedName : undefined,
            telefone: phoneChanged ? formattedPhone : undefined,
            aniversario: birthdayChanged ? normalizedBirthday : undefined,
          },
        });
      }
    }

    const payload = { sub: client.id, phone: client.telefone, role: 'CLIENT', tenantId: client.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
      client: {
        id: client.id,
        nome: client.nome,
        telefone: client.telefone,
        role: 'CLIENT',
        tenantId: client.tenantId,
      },
    };
  }

  async seedDemoData() {
    // 1. Limpar banco de dados anterior
    await this.prisma.productCommission.deleteMany({});
    await this.prisma.serviceCommission.deleteMany({});
    await this.prisma.feedback.deleteMany({});
    await this.prisma.message.deleteMany({});
    await this.prisma.appointment.deleteMany({});
    await this.prisma.workSchedule.deleteMany({});
    await this.prisma.agendaBlock.deleteMany({});
    await this.prisma.barber.deleteMany({});
    await this.prisma.user.deleteMany({});
    await this.prisma.client.deleteMany({});
    await this.prisma.product.deleteMany({});
    await this.prisma.service.deleteMany({});
    await this.prisma.quickReply.deleteMany({});
    await this.prisma.goal.deleteMany({});
    await this.prisma.auditLog.deleteMany({});

    // 2. Criar Serviços com foco em Salão Premium
    const corteFeminino = await this.prisma.service.create({
      data: { nome: 'Corte Feminino Premium', preco: 180.0, duracao: 60 },
    });
    const escova = await this.prisma.service.create({
      data: { nome: 'Escova & Hidratação Imperial', preco: 120.0, duracao: 45 },
    });
    const coloracao = await this.prisma.service.create({
      data: { nome: 'Coloração & Mechas Da Vinci', preco: 280.0, duracao: 120 },
    });
    const corteMasculino = await this.prisma.service.create({
      data: { nome: 'Corte Masculino Premium', preco: 90.0, duracao: 45 },
    });
    const barba = await this.prisma.service.create({
      data: { nome: 'Barba & Toalha Quente', preco: 60.0, duracao: 30 },
    });
    const manicure = await this.prisma.service.create({
      data: { nome: 'Manicure & Pedicure Premium', preco: 85.0, duracao: 60 },
    });

    const prodShampoo = await this.prisma.product.create({
      data: {
        nome: 'Shampoo Repair Da Vinci',
        preco: 89.9,
        descricao: 'Shampoo de tratamento para manutenção premium pós-coloração e hidratação.',
        commissionRate: 10.0,
      },
    });

    await this.prisma.product.create({
      data: {
        nome: 'Máscara Nutritiva Imperial',
        preco: 129.9,
        descricao: 'Máscara capilar de nutrição intensa para uso semanal.',
        commissionRate: 12.0,
      },
    });

    const prodPomada = await this.prisma.product.create({
      data: {
        nome: 'Pomada Matte Signature',
        preco: 59.9,
        descricao: 'Pomada de fixação média com acabamento seco para penteados masculinos.',
        commissionRate: 8.0,
      },
    });

    await this.prisma.product.create({
      data: {
        nome: 'Óleo Finalizador Golden Touch',
        preco: 74.9,
        descricao: 'Óleo leve para brilho e controle de frizz sem pesar nos fios.',
        commissionRate: 15.0,
      },
    });

    // Senhas hash
    const adminSenha = await bcrypt.hash('admin1', 10);
    const demoSenha = await bcrypt.hash('demo1', 10);
    const atendenteSenha = await bcrypt.hash('atendente1', 10);
    const barber1Senha = await bcrypt.hash('barbeiro1', 10);
    const hairdresser1Senha = await bcrypt.hash('cabeleireira1', 10);
    const manicure2Senha = await bcrypt.hash('manicure2', 10);

    // 3. Criar Usuários
    const userAdmin = await this.prisma.user.create({
      data: {
        nome: 'Administrador 1',
        email: 'admin1@salao.com',
        senha: adminSenha,
        role: 'ADMIN',
      },
    });

    const userAtendente = await this.prisma.user.create({
      data: {
        nome: 'Atendente 1',
        email: 'atendente1@salao.com',
        senha: atendenteSenha,
        role: 'ATTENDANT',
      },
    });

    await this.prisma.user.create({
      data: {
        nome: 'Conta Demo',
        email: 'demo1@salao.com',
        senha: demoSenha,
        role: 'ADMIN',
        roles: ['ADMIN'],
      },
    });

    const userAlessandro = await this.prisma.user.create({
      data: {
        nome: 'Barbeiro 1',
        email: 'barbeiro1@salao.com',
        senha: barber1Senha,
        role: 'BARBER',
        roles: ['BARBER'],
      },
    });

    const userMarcus = await this.prisma.user.create({
      data: {
        nome: 'Cabeleireira 1',
        email: 'cabeleireira1@salao.com',
        senha: hairdresser1Senha,
        role: 'HAIRDRESSER',
        roles: ['HAIRDRESSER'],
      },
    });

    const userMariana = await this.prisma.user.create({
      data: {
        nome: 'Manicure 2',
        email: 'manicure2@salao.com',
        senha: manicure2Senha,
        role: 'MANICURE_PEDICURE',
        roles: ['MANICURE_PEDICURE'],
      },
    });

    // 4. Criar Profissionais
    const professional1 = await this.prisma.barber.create({
      data: {
        userId: userAlessandro.id,
        categoria: 'BARBER',
        especialidade: 'Cortes masculinos premium, degradê baixo, visagismo e barboterapia.',
        miniBio: 'Especialista em cortes masculinos premium e acabamento com toalha quente.',
        commissionRate: 50.0,
        notaMedia: 4.95,
        services: {
          connect: [{ id: corteMasculino.id }, { id: barba.id }],
        },
      },
    });

    const professional2 = await this.prisma.barber.create({
      data: {
        userId: userMarcus.id,
        categoria: 'HAIRDRESSER',
        especialidade: 'Cortes unissex clássicos, escovas de alta performance e modelagem.',
        miniBio: 'Atende cortes femininos, escovas e modelagens com foco em visagismo.',
        commissionRate: 45.0,
        notaMedia: 4.88,
        services: {
          connect: [{ id: corteFeminino.id }, { id: escova.id }, { id: corteMasculino.id }],
        },
      },
    });

    const professional3 = await this.prisma.barber.create({
      data: {
        userId: userMariana.id,
        categoria: 'MANICURE_PEDICURE',
        especialidade: 'Estilista de mechas, coloração avançada, tratamentos capilares e cortes femininos.',
        miniBio: 'Referência em coloração, mechas e finalizações para eventos.',
        commissionRate: 55.0,
        notaMedia: 4.98,
        services: {
          connect: [{ id: coloracao.id }, { id: manicure.id }, { id: escova.id }],
        },
      },
    });

    await this.prisma.productCommission.create({
      data: {
        productId: prodShampoo.id,
        barberId: professional3.id,
        commissionRate: 20.0,
      },
    });

    await this.prisma.productCommission.create({
      data: {
        productId: prodPomada.id,
        barberId: professional1.id,
        commissionRate: 15.0,
      },
    });

    await this.prisma.serviceCommission.create({
      data: {
        serviceId: coloracao.id,
        barberId: professional3.id,
        commissionRate: 60.0,
      },
    });

    await this.prisma.serviceCommission.create({
      data: {
        serviceId: corteMasculino.id,
        barberId: professional1.id,
        commissionRate: 52.0,
      },
    });

    // 5. Criar Clientes
    const client1 = await this.prisma.client.create({
      data: {
        nome: 'Clara Vasconcelos',
        telefone: '11988887777',
        aniversario: '15/09',
        observacoes: 'Prefere chá de camomila morno. Faz coloração a cada 3 meses. Evitar secador excessivamente quente.',
        preferences: 'Corte Long Bob, luzes mel, finalização com ondas suaves.',
        frequency: 6,
        ticketMedio: 220.0,
        chatStatus: 'CONFIRMED',
        origem: 'WhatsApp',
        tags: ['VIP', 'Coloração'],
        assignedBarberId: professional3.id,
      },
    });

    const client2 = await this.prisma.client.create({
      data: {
        nome: 'Juliana Martins',
        telefone: '11977776666',
        aniversario: '22/01',
        observacoes: 'Cabelo cacheado 3B. Gosta de espumante brut durante os procedimentos longos.',
        preferences: 'Corte em camadas para dar volume, hidratação profunda sem sulfatos.',
        frequency: 4,
        ticketMedio: 150.0,
        chatStatus: 'BOOKING',
        origem: 'Instagram',
        tags: ['Cacheado'],
        assignedBarberId: professional2.id,
      },
    });

    const client3 = await this.prisma.client.create({
      data: {
        nome: 'Beatriz Rocha',
        telefone: '11966665555',
        aniversario: '08/04',
        observacoes: 'Gosta de silêncio e discrição no atendimento.',
        preferences: 'Corte Pixie moderno com nuca limpa, coloração tom ruivo acobreado.',
        frequency: 3,
        ticketMedio: 190.0,
        chatStatus: 'NEW',
        origem: 'Indicação',
        tags: ['Discrição'],
        assignedBarberId: professional3.id,
      },
    });

    const client4 = await this.prisma.client.create({
      data: {
        nome: 'Enzo Rossi',
        telefone: '11955554444',
        aniversario: '30/11',
        observacoes: 'Prefere café expresso curto e sem açúcar. Corte com máquina e tesoura.',
        preferences: 'Corte masculino clássico com laterais disfarçadas na máquina 2.',
        frequency: 8,
        ticketMedio: 90.0,
        chatStatus: 'COMPLETED',
        origem: 'WhatsApp',
        tags: ['Barba'],
        assignedBarberId: professional1.id,
      },
    });

    const client5 = await this.prisma.client.create({
      data: {
        nome: 'Lucas Silva',
        telefone: '11944443333',
        aniversario: '12/07',
        observacoes: 'Sensibilidade na pele ao fazer a barba. Usar loção pós-barba de calêndula.',
        preferences: 'Corte masculino degradê médio, barba apenas aparada e desenhada.',
        frequency: 5,
        ticketMedio: 110.0,
        chatStatus: 'CONFIRMED',
        origem: 'Google',
        tags: ['Pele sensível'],
        assignedBarberId: professional1.id,
      },
    });

    // 6. Agendamentos Passados
    const pastDates = [
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    ];

    const app1 = await this.prisma.appointment.create({
      data: {
        clientId: client1.id,
        barberId: professional3.id,
        serviceId: coloracao.id,
        data: new Date(pastDates[0].setHours(10, 0, 0, 0)),
        status: 'COMPLETED',
        valor: coloracao.preco,
      },
    });

    const app2 = await this.prisma.appointment.create({
      data: {
        clientId: client2.id,
        barberId: professional2.id,
        serviceId: corteFeminino.id,
        data: new Date(pastDates[1].setHours(14, 0, 0, 0)),
        status: 'COMPLETED',
        valor: corteFeminino.preco,
      },
    });

    const app3 = await this.prisma.appointment.create({
      data: {
        clientId: client3.id,
        barberId: professional3.id,
        serviceId: escova.id,
        data: new Date(pastDates[2].setHours(16, 0, 0, 0)),
        status: 'COMPLETED',
        valor: escova.preco,
      },
    });

    const app4 = await this.prisma.appointment.create({
      data: {
        clientId: client4.id,
        barberId: professional1.id,
        serviceId: corteMasculino.id,
        data: new Date(pastDates[3].setHours(11, 0, 0, 0)),
        status: 'COMPLETED',
        valor: corteMasculino.preco,
      },
    });

    const app5 = await this.prisma.appointment.create({
      data: {
        clientId: client5.id,
        barberId: professional1.id,
        serviceId: corteMasculino.id,
        data: new Date(pastDates[4].setHours(15, 0, 0, 0)),
        status: 'COMPLETED',
        valor: corteMasculino.preco,
      },
    });

    // 7. Feedbacks
    await this.prisma.feedback.create({
      data: {
        appointmentId: app1.id,
        nota: 5,
        comentario: 'Coloração impecável com a Mariana. O tom de mechas mel ficou fantástico!',
        ratingBarber: 5,
        ratingEnv: 5,
        ratingPunctual: '5',
      },
    });

    await this.prisma.feedback.create({
      data: {
        appointmentId: app2.id,
        nota: 5,
        comentario: 'Corte feminino moderno, adorei o visagismo sugerido pelo Marcus.',
        ratingBarber: 5,
        ratingEnv: 5,
        ratingPunctual: '5',
      },
    });

    await this.prisma.feedback.create({
      data: {
        appointmentId: app3.id,
        nota: 5,
        comentario: 'A escova com hidratação dura dias, atendimento espetacular com chás aromáticos.',
        ratingBarber: 5,
        ratingEnv: 5,
        ratingPunctual: '5',
      },
    });

    // 8. Agendamentos de Hoje/Amanhã
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    await this.prisma.appointment.create({
      data: {
        clientId: client1.id,
        barberId: professional3.id,
        serviceId: escova.id,
        data: new Date(hoje.setHours(10, 0, 0, 0)),
        status: 'CONFIRMED',
        valor: escova.preco,
      },
    });

    await this.prisma.appointment.create({
      data: {
        clientId: client2.id,
        barberId: professional3.id,
        serviceId: coloracao.id,
        data: new Date(hoje.setHours(13, 0, 0, 0)),
        status: 'IN_PROGRESS',
        valor: coloracao.preco,
      },
    });

    await this.prisma.appointment.create({
      data: {
        clientId: client3.id,
        barberId: professional2.id,
        serviceId: corteFeminino.id,
        data: new Date(hoje.setHours(15, 0, 0, 0)),
        status: 'CHECKED_IN',
        valor: corteFeminino.preco,
      },
    });

    await this.prisma.appointment.create({
      data: {
        clientId: client4.id,
        barberId: professional1.id,
        serviceId: corteMasculino.id,
        data: new Date(amanha.setHours(14, 0, 0, 0)),
        status: 'SCHEDULED',
        valor: corteMasculino.preco,
      },
    });

    await this.prisma.appointment.create({
      data: {
        clientId: client5.id,
        barberId: professional1.id,
        serviceId: corteMasculino.id,
        data: new Date(amanha.setHours(11, 0, 0, 0)),
        status: 'SCHEDULED',
        valor: corteMasculino.preco,
      },
    });

    // 9. Conversas do WhatsApp
    await this.prisma.message.create({
      data: {
        clientId: client1.id,
        mensagem: 'Olá! Quero agendar uma escova e hidratação para a próxima terça.',
        tipo: 'RECEIVED',
      },
    });

    await this.prisma.message.create({
      data: {
        clientId: client1.id,
        mensagem: 'Com certeza Clara! Agendamos com a Mariana às 10:00. Combinado?',
        tipo: 'SENT',
      },
    });

    await this.prisma.message.create({
      data: {
        clientId: client1.id,
        mensagem: 'Perfeito! Obrigado pelo retorno rápido.',
        tipo: 'RECEIVED',
      },
    });

    // 10. Grade de trabalho e bloqueios para demonstrar disponibilidade na agenda
    const professionals = [professional1.id, professional2.id, professional3.id];
    for (const barberId of professionals) {
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        await this.prisma.workSchedule.create({
          data: {
            barberId,
            dayOfWeek,
            startTime: '09:00',
            endTime: '20:00',
            breakStart: '12:00',
            breakEnd: '13:00',
            active: dayOfWeek !== 0,
          },
        });
      }
    }

    const blockDate = new Date();
    await this.prisma.agendaBlock.create({
      data: {
        barberId: professional1.id,
        titulo: 'Bloqueio de Almoço',
        dataInicio: new Date(blockDate.getFullYear(), blockDate.getMonth(), blockDate.getDate(), 12, 0, 0),
        dataFim: new Date(blockDate.getFullYear(), blockDate.getMonth(), blockDate.getDate(), 13, 0, 0),
      },
    });

    // 11. Respostas rápidas para a demonstração do atendimento
    await this.prisma.quickReply.createMany({
      data: [
        {
          titulo: 'Confirmação',
          conteudo: 'Olá! Confirmamos seu horário agendado para hoje. Aguardamos sua visita!',
        },
        {
          titulo: 'Boas-vindas',
          conteudo: 'Olá! Seja muito bem-vindo(a). Como posso te ajudar hoje?',
        },
        {
          titulo: 'Atraso',
          conteudo: 'Olá! Tivemos um pequeno imprevisto na agenda de hoje e seu atendimento pode atrasar cerca de 10 minutos. Tudo bem para você?',
        },
        {
          titulo: 'Pós-atendimento',
          conteudo: 'Foi um prazer receber você hoje. Pode avaliar seu atendimento pelo link enviado?',
        },
      ],
    });

    // 12. Metas e auditoria para o dashboard financeiro
    const goalBaseDate = new Date();
    const dataInicioMeta = new Date(goalBaseDate.getFullYear(), goalBaseDate.getMonth(), 1);
    const dataFimMeta = new Date(goalBaseDate.getFullYear(), goalBaseDate.getMonth() + 1, 0, 23, 59, 59);

    await this.prisma.goal.create({
      data: {
        titulo: 'Meta de Faturamento Mensal',
        tipo: 'BILLING',
        valorAlvo: 15000.0,
        valorAtual: 900.0,
        dataInicio: dataInicioMeta,
        dataFim: dataFimMeta,
      },
    });

    await this.prisma.goal.create({
      data: {
        titulo: 'Meta de Atendimentos Mensal',
        tipo: 'SERVICES',
        valorAlvo: 100.0,
        valorAtual: 25.0,
        dataInicio: dataInicioMeta,
        dataFim: dataFimMeta,
      },
    });

    await this.prisma.auditLog.createMany({
      data: [
        {
          usuario: 'Administrador 1',
          acao: 'Cadastro de Profissional',
          detalhes: 'Profissional Manicure 2 cadastrado com categoria, mini bio e comissão padrão.',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          usuario: 'Atendente 1',
          acao: 'Agendamento Criado',
          detalhes: `Agendamento criado para Clara Vasconcelos no dia ${goalBaseDate.toLocaleDateString('pt-BR')}.`,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          usuario: 'Administrador 1',
          acao: 'Alteração de Comissão',
          detalhes: 'Comissão do produto Shampoo Repair alterada para 20% para a profissional Manicure 2.',
          createdAt: new Date(),
        },
      ],
    });

    return { success: true, message: 'Banco de dados semeado!' };
  }
}
