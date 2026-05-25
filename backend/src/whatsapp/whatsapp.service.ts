import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

interface BookingState {
  step: 'AWAITING_TIME';
  date: Date;
  serviceId: string;
  barberId: string;
}

@Injectable()
export class WhatsappService {
  // Estado simples na memória para rastrear o fluxo de conversa de cada cliente
  private clientStates = new Map<string, BookingState>();

  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
  ) {}

  async getChatHistory(clientId: string) {
    return this.prisma.message.findMany({
      where: { clientId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async receiveCustomerMessage(clientId: string, text: string) {
    // 1. Salvar mensagem recebida do cliente
    const customerMsg = await this.prisma.message.create({
      data: {
        clientId,
        mensagem: text,
        tipo: 'RECEIVED',
      },
    });

    // Notificar frontend da nova mensagem
    this.wsGateway.broadcast('new-message', {
      clientId,
      message: customerMsg,
    });

    // 2. Processar chatbot de agendamento automático
    await this.processChatbot(clientId, text);

    return customerMsg;
  }

  async sendOperatorMessage(clientId: string, text: string) {
    // Envio manual pelo atendente do CRM
    const operatorMsg = await this.prisma.message.create({
      data: {
        clientId,
        mensagem: text,
        tipo: 'SENT',
      },
    });

    // Notificar frontend
    this.wsGateway.broadcast('new-message', {
      clientId,
      message: operatorMsg,
    });

    // Enviar mensagem real via Evolution API (se configurado)
    await this.sendRealWhatsApp(clientId, text);

    return operatorMsg;
  }

  async sendRealWhatsApp(clientId: string, text: string) {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY || process.env.GLOBAL_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    if (!apiUrl || !apiKey || !instanceName) {
      console.log('Evolution API não configurada. Ignorando envio real do WhatsApp.');
      return;
    }

    try {
      const client = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!client || !client.telefone) {
        console.warn(`Cliente não encontrado ou sem telefone para envio real do WhatsApp.`);
        return;
      }

      // Limpar o número do telefone para conter apenas dígitos
      let cleanedPhone = client.telefone.replace(/\D/g, '');
      if (cleanedPhone.length === 11 && cleanedPhone.startsWith('9')) {
        cleanedPhone = `55${cleanedPhone}`;
      } else if (cleanedPhone.length === 10) {
        cleanedPhone = `55${cleanedPhone}`;
      } else if (cleanedPhone.length === 9) {
        cleanedPhone = `5511${cleanedPhone}`;
      }

      const url = `${apiUrl}/message/sendText/${instanceName}`;
      const payload = {
        number: cleanedPhone,
        text: text,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ao enviar mensagem via Evolution API. Status: ${response.status}. Detalhes: ${errorText}`);
      } else {
        console.log(`Mensagem de WhatsApp real enviada via Evolution API para ${cleanedPhone}!`);
      }
    } catch (error) {
      console.error('Erro na conexão com a Evolution API:', error);
    }
  }

  async handleEvolutionWebhook(body: any) {
    console.log('[Webhook] Recebido payload da Evolution API:', JSON.stringify(body, null, 2));

    const event = body.event || body.type;
    // O evento de mensagem recebida na Evolution API v2 é 'messages.upsert'
    if (event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
      console.log(`[Webhook] Evento ignorado: ${event}`);
      return { status: 'ignored_event', event };
    }

    const fromMe = body.data?.key?.fromMe;
    if (fromMe === true) {
      console.log('[Webhook] Mensagem de saída ignorada (fromMe = true)');
      return { status: 'ignored_outgoing' };
    }

    const remoteJid = body.data?.key?.remoteJid;
    if (!remoteJid) {
      console.log('[Webhook] Sem remoteJid no payload');
      return { status: 'no_remote_jid' };
    }

    // Limpar o número do telefone
    const phone = remoteJid.split('@')[0];
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone) {
      console.log('[Webhook] Número de telefone inválido ou vazio');
      return { status: 'invalid_phone' };
    }

    // Tentar obter o conteúdo do texto ou mapear tipos de mídia/outros
    let text = body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text;
    if (!text) {
      const messageType = body.data?.messageType;
      if (messageType) {
        text = `[Mensagem do tipo: ${messageType}]`;
      } else {
        text = '[Mensagem sem conteúdo textual]';
      }
    }

    console.log(`[Webhook] Processando mensagem de ${cleanedPhone}: "${text}"`);

    // Tentar casar o cliente no CRM usando os últimos 8 dígitos do telefone
    const last8 = cleanedPhone.substring(cleanedPhone.length - 8);
    const clients = await this.prisma.client.findMany();
    let client = clients.find((c) => {
      const cPhoneCleaned = c.telefone.replace(/\D/g, '');
      return cPhoneCleaned.endsWith(last8);
    });

    if (!client) {
      // Se não existir, cadastramos o lead automaticamente!
      const pushName = body.data?.pushName || 'Novo Cliente WhatsApp';
      // Salva o telefone formatado de forma básica
      let formattedPhone = phone;
      if (phone.length === 13 && phone.startsWith('55')) {
        formattedPhone = `+55 (${phone.substring(2, 4)}) ${phone.substring(4, 9)}-${phone.substring(9)}`;
      }
      
      client = await this.prisma.client.create({
        data: {
          nome: pushName,
          telefone: formattedPhone,
          observacoes: 'Cadastrado automaticamente via recepção de WhatsApp.',
        },
      });

      // Notificar dashboard que um novo lead foi capturado
      this.wsGateway.broadcast('dashboard-notification', {
        title: 'Novo Lead Capturado',
        description: `Cliente ${pushName} se conectou via WhatsApp e foi cadastrado no CRM.`,
        type: 'info',
        timestamp: new Date(),
      });
    }

    // Processar a mensagem recebida e acionar o chatbot
    await this.receiveCustomerMessage(client.id, text);

    return { status: 'success', clientId: client.id };
  }

  private async processChatbot(clientId: string, text: string) {
    const lowercaseText = text.toLowerCase();
    const state = this.clientStates.get(clientId);

    // Buscar dados essenciais para o fluxo
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;

    const service = await this.prisma.service.findFirst() || await this.prisma.service.create({
      data: { nome: 'Corte Premium', preco: 80.0, duracao: 45 },
    });

    const barber = await this.prisma.barber.findFirst({ include: { user: true } });
    if (!barber) return;

    if (!state) {
      // Verificar intenção de agendamento
      const bookingKeywords = ['cortar', 'agendar', 'cabelo', 'barba', 'horario', 'horário', 'agenda', 'vaga', 'marcar'];
      const wantsToBook = bookingKeywords.some((word) => lowercaseText.includes(word));

      if (wantsToBook) {
        // Calcular amanhã
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        // Salvar estado do cliente
        this.clientStates.set(clientId, {
          step: 'AWAITING_TIME',
          date: tomorrow,
          serviceId: service.id,
          barberId: barber.id,
        });

        // Responder com opções de horários
        const replyText = `Olá, ${client.nome}! Sou o concierge virtual da Da Vinci. 🤵\n\nIdentifiquei que você deseja realizar um agendamento para **${service.nome}** (R$ ${service.preco.toFixed(2)}).\n\nTemos as seguintes vagas com o profissional **${barber.user.nome}** para amanhã:\n\n👉 **10:00**\n👉 **14:00**\n👉 **16:00**\n\nPor favor, digite o horário desejado para confirmarmos seu agendamento.`;
        await this.delayAndReply(clientId, replyText);
      } else {
        // Resposta padrão
        const replyText = `Olá! Sou o concierge virtual da Da Vinci. 🤵\n\nComo posso ajudar? Se você gostaria de agendar um serviço, basta digitar algo como *"Quero agendar um corte amanhã"*.`;
        await this.delayAndReply(clientId, replyText);
      }
    } else if (state.step === 'AWAITING_TIME') {
      // Tentar casar horários
      let targetHour = -1;
      if (lowercaseText.includes('10')) targetHour = 10;
      else if (lowercaseText.includes('14')) targetHour = 14;
      else if (lowercaseText.includes('16')) targetHour = 16;

      if (targetHour !== -1) {
        const appointmentDate = new Date(state.date);
        appointmentDate.setHours(targetHour, 0, 0, 0);

        // Criar agendamento no banco
        const appointment = await this.prisma.appointment.create({
          data: {
            clientId,
            barberId: state.barberId,
            serviceId: state.serviceId,
            data: appointmentDate,
            status: 'CONFIRMED', // Confirmado automaticamente
            valor: service.preco,
          },
          include: {
            client: true,
            barber: { include: { user: true } },
            service: true,
          },
        });

        // Limpar estado
        this.clientStates.delete(clientId);

        // Notificar via websockets
        this.wsGateway.broadcast('appointment-created', appointment);

        this.wsGateway.broadcast('dashboard-notification', {
          title: 'Agendamento Automatizado',
          description: `${client.nome} agendou corte com ${barber.user.nome} para às ${targetHour}:00 via WhatsApp.`,
          type: 'success',
          timestamp: new Date(),
        });

        // Responder confirmando
        const replyText = `Excelente escolha, ${client.nome}! ✅\n\nSeu agendamento para **${service.nome}** está confirmado:\n\n📅 **Amanhã** às **${targetHour}:00**\n💈 Profissional: **${barber.user.nome}**\n\nSeu check-in já está ativo no nosso sistema. Estaremos te esperando com um café expresso, chá ou uma taça de espumante gelada! ☕🍵🥂`;
        await this.delayAndReply(clientId, replyText);
      } else {
        const replyText = `Não consegui identificar esse horário. 🧐\n\nPor favor, escolha uma das opções válidas:\n\n👉 **10:00**\n👉 **14:00**\n👉 **16:00**\n\nDigite apenas o número correspondente.`;
        await this.delayAndReply(clientId, replyText);
      }
    }
  }

  private async delayAndReply(clientId: string, text: string) {
    // Simular digitação humana/atraso da API
    setTimeout(async () => {
      const autoMsg = await this.prisma.message.create({
        data: {
          clientId,
          mensagem: text,
          tipo: 'SENT',
        },
      });

      this.wsGateway.broadcast('new-message', {
        clientId,
        message: autoMsg,
      });

      // Enviar mensagem real via Evolution API (se configurado)
      await this.sendRealWhatsApp(clientId, text);
    }, 1500);
  }

  async debugIntegration() {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY || process.env.GLOBAL_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    if (!apiUrl) {
      return { status: 'error', message: 'EVOLUTION_API_URL está indefinido.' };
    }

    const sanitizedUrl = apiUrl.replace(/\/$/, '');
    const config = {
      rawApiUrl: apiUrl,
      sanitizedUrl,
      apiKeyMasked: apiKey ? `${apiKey.substring(0, Math.min(5, apiKey.length))}...${apiKey.substring(Math.max(0, apiKey.length - 3))}` : 'undefined',
      instanceName: instanceName || 'undefined',
    };

    if (!apiKey || !instanceName) {
      return {
        status: 'error',
        message: 'Variáveis de ambiente da Evolution API (apiKey ou instanceName) não estão totalmente configuradas.',
        config,
      };
    }

    try {
      // 1. Tentar buscar todas as instâncias para ver os nomes e status disponíveis
      const fetchInstancesUrl = `${sanitizedUrl}/instance/fetchInstances`;
      console.log(`[Debug Webhook] Chamando: ${fetchInstancesUrl}`);
      const listResponse = await fetch(fetchInstancesUrl, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });
      const instancesList = listResponse.ok ? await listResponse.json() : { error: await listResponse.text(), status: listResponse.status };

      // 2. Verificar estado da conexão da instância específica
      const connUrl = `${sanitizedUrl}/instance/connectionState/${instanceName}`;
      console.log(`[Debug Webhook] Chamando: ${connUrl}`);
      const connResponse = await fetch(connUrl, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });
      const connState = connResponse.ok ? await connResponse.json() : { error: await connResponse.text(), status: connResponse.status };

      // 3. Verificar configurações do Webhook da instância
      const webhookUrl = `${sanitizedUrl}/webhook/find/${instanceName}`;
      console.log(`[Debug Webhook] Chamando: ${webhookUrl}`);
      const webhookResponse = await fetch(webhookUrl, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });
      const webhookConfig = webhookResponse.ok ? await webhookResponse.json() : { error: await webhookResponse.text(), status: webhookResponse.status };

      // 4. Verificar estado do QR Code / Conexão ativa
      const connectUrl = `${sanitizedUrl}/instance/connect/${instanceName}`;
      console.log(`[Debug Webhook] Chamando: ${connectUrl}`);
      const connectResponse = await fetch(connectUrl, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });
      let connectStatus = { status: connectResponse.status, data: {} as any };
      if (connectResponse.ok) {
        const data = await connectResponse.json();
        if (data.code) {
          connectStatus.data = { status: 'waiting_qr_code', hasCode: true, message: 'Instância aguardando leitura de QR Code.' };
        } else {
          connectStatus.data = data;
        }
      } else {
        connectStatus.data = { error: await connectResponse.text() };
      }

      return {
        status: 'success',
        config,
        instancesList,
        connectionState: connState,
        webhookConfigOnEvolution: webhookConfig,
        connectStatusOnEvolution: connectStatus,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Falha ao conectar na Evolution API: ${error.message}`,
        config,
      };
    }
  }
}
