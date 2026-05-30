import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

interface BookingState {
  step: 'AWAITING_NAME' | 'AWAITING_TIME';
  date?: Date;
  serviceId?: string;
  barberId?: string;
}

const safeUserSelect = {
  id: true,
  nome: true,
  email: true,
  role: true,
  roles: true,
  tenantId: true,
};

@Injectable()
export class WhatsappService {
  // Estado simples na memória para rastrear o fluxo de conversa de cada cliente
  private clientStates = new Map<string, BookingState>();

  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
  ) {}

  private async checkClientTenant(clientId: string, tenantId?: string) {
    if (!tenantId) return;
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado neste estabelecimento');
    }
  }

  async getChatHistory(clientId: string, tenantId?: string) {
    await this.checkClientTenant(clientId, tenantId);
    return this.prisma.message.findMany({
      where: { clientId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async receiveCustomerMessage(clientId: string, text: string, bypassChatbot = false, tenantId?: string) {
    await this.checkClientTenant(clientId, tenantId);
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
      tenantId,
      clientId,
      message: customerMsg,
    });

    // 2. Processar chatbot de agendamento automático
    if (!bypassChatbot) {
      await this.processChatbot(clientId, text);
    }

    return customerMsg;
  }

  async sendOperatorMessage(clientId: string, text: string, tenantId?: string) {
    await this.checkClientTenant(clientId, tenantId);
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
      tenantId,
      clientId,
      message: operatorMsg,
    });

    // Enviar mensagem real via Evolution API (se configurado)
    await this.sendRealWhatsApp(clientId, text);

    return operatorMsg;
  }

  async sendRealWhatsApp(clientId: string, text: string) {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: { tenant: true },
      });
      if (!client || !client.telefone) {
        console.warn(`Cliente não encontrado ou sem telefone para envio real do WhatsApp.`);
        return;
      }

      const tenant = client.tenant;
      const apiUrl = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-67e4.up.railway.app';
      const apiKey = process.env.EVOLUTION_API_KEY || process.env.GLOBAL_API_KEY;
      const instanceName = tenant?.whatsAppInstance;
      const status = tenant?.whatsAppStatus;

      if (!instanceName || status !== 'CONNECTED') {
        console.log('Instância WhatsApp do tenant não conectada ou nula. Ignorando envio real.');
        return;
      }

      if (!apiUrl || !apiKey) {
        console.log('Evolution API não configurada globalmente no .env. Ignorando envio real.');
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

      const url = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`;
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

  async connectInstance(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Estabelecimento não encontrado');

    const apiUrl = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-67e4.up.railway.app';
    const apiKey = process.env.EVOLUTION_API_KEY || process.env.GLOBAL_API_KEY;
    const instanceName = `instance-${tenantId}`;

    // SE NÃO HOUVER API_KEY NO ENV, ENTRA EM MODO SIMULADOR AUTOMATICAMENTE
    if (!apiKey) {
      console.log('[WhatsApp] Sem Evolution API Key. Ativando simulação.');
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          whatsAppInstance: instanceName,
          whatsAppStatus: 'CONNECTING',
        },
      });
      return {
        simulated: true,
        qrcode: 'MOCK_QR_CODE_DATA',
        instanceName,
      };
    }

    try {
      const sanitizedUrl = apiUrl.replace(/\/$/, '');

      // 1. Verificar se a instância já existe
      const checkRes = await fetch(`${sanitizedUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': apiKey },
      });

      let instanceExists = checkRes.status === 200;

      if (!instanceExists) {
        // Criar instância
        const createRes = await fetch(`${sanitizedUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify({
            instanceName,
            token: `token-${tenantId}`,
            qrcode: true,
          }),
        });

        if (!createRes.ok) {
          throw new Error(`Falha ao criar instância: ${await createRes.text()}`);
        }
      }

      // 2. Buscar/Gerar QR Code
      const connectRes = await fetch(`${sanitizedUrl}/instance/connect/${instanceName}`, {
        headers: { 'apikey': apiKey },
      });

      if (!connectRes.ok) {
        throw new Error(`Falha ao obter QR code da instância: ${await connectRes.text()}`);
      }

      const connectData = await connectRes.json();

      // Salvar instância e token no banco do Tenant, com status CONNECTING
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          whatsAppInstance: instanceName,
          whatsAppToken: `token-${tenantId}`,
          whatsAppStatus: 'CONNECTING',
        },
      });

      // 3. Configurar o Webhook de forma automática
      const webhookSecret = process.env.WEBHOOK_SECRET_KEY || 'default_secret';
      const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const webhookUrl = `${backendUrl}/whatsapp/webhook?token=${webhookSecret}&tenantId=${tenantId}`;

      await fetch(`${sanitizedUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          events: ['MESSAGES_UPSERT'],
        }),
      });

      return {
        simulated: false,
        qrcode: connectData.code || connectData.base64 || connectData.qrcode || '',
        instanceName,
      };

    } catch (err: any) {
      console.error('[WhatsApp Connect Error]', err);
      // Fallback para simulação se der erro na rede/Evolution API
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          whatsAppInstance: instanceName,
          whatsAppStatus: 'CONNECTING',
        },
      });
      return {
        simulated: true,
        qrcode: 'MOCK_QR_CODE_DATA',
        instanceName,
        error: err.message,
      };
    }
  }

  async checkInstanceStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Estabelecimento não encontrado');

    const apiKey = process.env.EVOLUTION_API_KEY || process.env.GLOBAL_API_KEY;
    if (!apiKey) {
      return { status: tenant.whatsAppStatus || 'DISCONNECTED', instanceName: tenant.whatsAppInstance };
    }

    if (!tenant.whatsAppInstance) {
      return { status: 'DISCONNECTED' };
    }

    try {
      const apiUrl = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-67e4.up.railway.app';
      const sanitizedUrl = apiUrl.replace(/\/$/, '');
      const res = await fetch(`${sanitizedUrl}/instance/connectionState/${tenant.whatsAppInstance}`, {
        headers: { 'apikey': apiKey },
      });

      if (res.ok) {
        const data = await res.json();
        const status = data.instance?.state === 'open' ? 'CONNECTED' : 'DISCONNECTED';
        
        if (tenant.whatsAppStatus !== status) {
          await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { whatsAppStatus: status },
          });
        }
        return { status, instanceName: tenant.whatsAppInstance };
      }

      return { status: tenant.whatsAppStatus || 'DISCONNECTED', instanceName: tenant.whatsAppInstance };
    } catch (err) {
      console.error('[WhatsApp Status Error]', err);
      return { status: tenant.whatsAppStatus || 'DISCONNECTED', instanceName: tenant.whatsAppInstance };
    }
  }

  async simulateConnectionSuccess(tenantId: string) {
    const status = 'CONNECTED';
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { whatsAppStatus: status },
    });
    this.wsGateway.broadcast('whatsapp-connected', { tenantId, status });
    return { status };
  }

  async disconnectInstance(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Estabelecimento não encontrado');

    const apiKey = process.env.EVOLUTION_API_KEY || process.env.GLOBAL_API_KEY;
    const apiUrl = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-67e4.up.railway.app';

    if (apiKey && tenant.whatsAppInstance) {
      try {
        const sanitizedUrl = apiUrl.replace(/\/$/, '');
        await fetch(`${sanitizedUrl}/instance/logout/${tenant.whatsAppInstance}`, {
          method: 'DELETE',
          headers: { 'apikey': apiKey },
        });
        await fetch(`${sanitizedUrl}/instance/delete/${tenant.whatsAppInstance}`, {
          method: 'DELETE',
          headers: { 'apikey': apiKey },
        });
      } catch (err) {
        console.error('[WhatsApp Disconnect API Error]', err);
      }
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        whatsAppInstance: null,
        whatsAppToken: null,
        whatsAppStatus: 'DISCONNECTED',
      },
    });

    this.wsGateway.broadcast('whatsapp-disconnected', { tenantId, status: 'DISCONNECTED' });
    return { status: 'DISCONNECTED' };
  }

  async handleEvolutionWebhook(body: any, tenantId?: string) {
    console.log('[Webhook] Recebido evento da Evolution API.');

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
    const clients = await this.prisma.client.findMany({
      where: tenantId ? { tenantId } : undefined,
    });
    let client = clients.find((c) => {
      const cPhoneCleaned = c.telefone.replace(/\D/g, '');
      return cPhoneCleaned.endsWith(last8);
    });

    if (!client) {
      // Se não existir, cadastramos o lead temporariamente aguardando o nome completo
      const tempName = 'Aguardando Nome';
      // Salva o telefone formatado de forma básica
      let formattedPhone = phone;
      if (phone.length === 13 && phone.startsWith('55')) {
        formattedPhone = `+55 (${phone.substring(2, 4)}) ${phone.substring(4, 9)}-${phone.substring(9)}`;
      }
      
      client = await this.prisma.client.create({
        data: {
          nome: tempName,
          telefone: formattedPhone,
          observacoes: 'Cadastrado temporariamente via recepção de WhatsApp. Aguardando o nome.',
          tenantId: tenantId || null,
        },
      });

      // Salvar o estado inicial de captura de nome
      this.clientStates.set(client.id, { step: 'AWAITING_NAME' });

      // Notificar dashboard que um novo lead iniciou o contato
      this.wsGateway.broadcast('dashboard-notification', {
        tenantId,
        title: 'Novo Contato WhatsApp',
        description: `Nova conversa iniciada pelo número ${formattedPhone}. Aguardando o nome.`,
        type: 'info',
        timestamp: new Date(),
      });

      // Salvar a mensagem recebida sem acionar o processamento de chatbot (pois ainda vamos perguntar o nome)
      await this.receiveCustomerMessage(client.id, text, true, tenantId);

      // Enviar mensagem de saudação e perguntar o nome
      const replyText = `Olá! Sou o atendimento virtual deste estabelecimento.\n\nIdentifiquei que este número de WhatsApp ainda não está cadastrado em nosso sistema.\n\nComo posso te chamar? Por favor, digite seu nome completo para iniciarmos seu atendimento.`;
      await this.delayAndReply(client.id, replyText, tenantId);

      return { status: 'success', clientId: client.id };
    }

    // Se o cliente já existia, processar a mensagem normalmente (aciona o chatbot)
    await this.receiveCustomerMessage(client.id, text, false, tenantId);

    return { status: 'success', clientId: client.id };
  }

  private async processChatbot(clientId: string, text: string) {
    const lowercaseText = text.toLowerCase();
    const state = this.clientStates.get(clientId);

    // Buscar dados essenciais para o fluxo
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;

    const scopedTenantId = client.tenantId || undefined;

    const service = await this.prisma.service.findFirst({
      where: scopedTenantId ? { tenantId: scopedTenantId } : undefined,
    }) || await this.prisma.service.create({
      data: { nome: 'Corte Premium', preco: 80.0, duracao: 45, tenantId: scopedTenantId || null },
    });

    const barber = await this.prisma.barber.findFirst({
      where: scopedTenantId ? { user: { tenantId: scopedTenantId } } : undefined,
      include: { user: { select: safeUserSelect } },
    });
    if (!barber) return;

    if (state && state.step === 'AWAITING_NAME') {
      const clientName = text.trim();
      if (clientName.length < 2) {
        await this.delayAndReply(clientId, 'Por favor, digite seu nome completo para que possamos te cadastrar.', scopedTenantId);
        return;
      }

      // Buscar se já existe um cliente com esse mesmo nome no banco (case-insensitive)
      const existingClient = await this.prisma.client.findFirst({
        where: {
          nome: { equals: clientName, mode: 'insensitive' },
          tenantId: scopedTenantId,
        },
      });

      let finalClientId = clientId;
      let finalName = clientName;

      if (existingClient) {
        // Encontrou cliente por nome -> Faz o merge da conta do WhatsApp
        try {
          // 1. Liberar a constraint de telefone único no temporário
          await this.prisma.client.update({
            where: { id: client.id },
            data: { telefone: `temp-del-${client.id}` },
          });

          // 2. Atualizar o telefone do cliente existente para o número da conversa
          await this.prisma.client.update({
            where: { id: existingClient.id },
            data: { telefone: client.telefone },
          });

          // 3. Apontar todas as mensagens do temporário para o existente
          await this.prisma.message.updateMany({
            where: { clientId: client.id },
            data: { clientId: existingClient.id },
          });

          // 4. Deletar o cliente temporário do banco
          await this.prisma.client.delete({
            where: { id: client.id },
          });

          finalClientId = existingClient.id;
          finalName = existingClient.nome;
        } catch (error) {
          console.error('[Chatbot] Erro ao associar cliente existente por nome:', error);
        }
      } else {
        // Não encontrou por nome -> Apenas renomeia o temporário
        await this.prisma.client.update({
          where: { id: client.id },
          data: { nome: clientName },
        });
      }

      // Limpar o estado AWAITING_NAME
      this.clientStates.delete(clientId);
      this.clientStates.delete(finalClientId);

      // Enviar mensagem de boas vindas com link do catálogo digital
      const replyText = `Prazer em falar com você, ${finalName}! Realizei o vínculo do seu WhatsApp com sucesso.\n\nComo posso ajudar você hoje?\n\nSe quiser agendar um horário diretamente, digite algo como "Quero agendar um corte".\n\nSe quiser conhecer nossos serviços, valores e produtos à venda, acesse o catálogo digital: https://crm-davinci-production.up.railway.app/catalogo`;
      await this.delayAndReply(finalClientId, replyText, scopedTenantId);
      return;
    }

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
        const replyText = `Olá, ${client.nome}!\n\nIdentifiquei que você deseja realizar um agendamento para ${service.nome} (R$ ${service.preco.toFixed(2)}).\n\nTemos as seguintes vagas com o profissional ${barber.user.nome} para amanhã:\n\n10:00\n14:00\n16:00\n\nPor favor, digite o horário desejado para confirmarmos seu agendamento.`;
        await this.delayAndReply(clientId, replyText, scopedTenantId);
      } else {
        // Resposta padrão
        const replyText = `Olá! Como posso ajudar?\n\nSe você gostaria de agendar um serviço, basta digitar algo como "Quero agendar um corte amanhã".`;
        await this.delayAndReply(clientId, replyText, scopedTenantId);
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
            tenantId: scopedTenantId || null,
          },
          include: {
            client: true,
            barber: { include: { user: { select: safeUserSelect } } },
            service: true,
          },
        });

        // Limpar estado
        this.clientStates.delete(clientId);

        // Notificar via websockets
        this.wsGateway.broadcast('appointment-created', appointment);

        this.wsGateway.broadcast('dashboard-notification', {
          tenantId: scopedTenantId,
          title: 'Agendamento Automatizado',
          description: `${client.nome} agendou corte com ${barber.user.nome} para às ${targetHour}:00 via WhatsApp.`,
          type: 'success',
          timestamp: new Date(),
        });

        // Responder confirmando
        const replyText = `Excelente escolha, ${client.nome}!\n\nSeu agendamento para ${service.nome} está confirmado:\n\nData: amanhã às ${targetHour}:00\nProfissional: ${barber.user.nome}\n\nSeu atendimento já está registrado no sistema.`;
        await this.delayAndReply(clientId, replyText, scopedTenantId);
      } else {
        const replyText = `Não consegui identificar esse horário. 🧐\n\nPor favor, escolha uma das opções válidas:\n\n👉 **10:00**\n👉 **14:00**\n👉 **16:00**\n\nDigite apenas o número correspondente.`;
        await this.delayAndReply(clientId, replyText, scopedTenantId);
      }
    }
  }

  private async delayAndReply(clientId: string, text: string, tenantId?: string) {
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
        tenantId,
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

  async getQuickReplies(tenantId?: string) {
    return this.prisma.quickReply.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { titulo: 'asc' },
    });
  }

  async createQuickReply(body: { titulo: string; conteudo: string }, tenantId?: string) {
    return this.prisma.quickReply.create({
      data: {
        titulo: body.titulo,
        conteudo: body.conteudo,
        tenantId: tenantId || null,
      },
    });
  }

  async deleteQuickReply(id: string, tenantId?: string) {
    const existing = await this.prisma.quickReply.findFirst({
      where: {
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
    });
    if (!existing) {
      throw new NotFoundException('Resposta rápida não encontrada neste estabelecimento');
    }
    return this.prisma.quickReply.delete({
      where: { id },
    });
  }

  async updateQuickReply(id: string, body: { titulo: string; conteudo: string }, tenantId?: string) {
    const existing = await this.prisma.quickReply.findFirst({
      where: {
        id,
        tenantId: tenantId ? tenantId : undefined,
      },
    });
    if (!existing) {
      throw new NotFoundException('Resposta rápida não encontrada neste estabelecimento');
    }
    return this.prisma.quickReply.update({
      where: { id },
      data: {
        titulo: body.titulo,
        conteudo: body.conteudo,
      },
    });
  }
}
