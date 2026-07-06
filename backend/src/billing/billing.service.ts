import { Injectable, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import Stripe = require('stripe');

@Injectable()
export class BillingService {
  private stripe: any = null;
  private webhookSecret: string | null = null;

  constructor(private prisma: PrismaService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || null;

    if (stripeKey && stripeKey !== 'your_stripe_secret_key_here') {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16' as any,
      });
    } else {
      console.warn('STRIPE_SECRET_KEY não configurada. O BillingService operará em modo de simulação.');
    }
  }

  // Criar sessão segura de checkout
  async createCheckoutSession(clientId: string, planId: string, tenantId: string, origin: string) {
    // Buscar plano e cliente
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, tenantId },
    });
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!plan || !client) {
      throw new BadRequestException('Plano ou cliente inválido para este estabelecimento.');
    }

    const successUrl = `${origin}/feedback/client-portal?session_id={CHECKOUT_SESSION_ID}&checkout_status=success`;
    const cancelUrl = `${origin}/feedback/client-portal?checkout_status=cancel`;

    if (this.stripe && !plan.gatewayPlanId?.startsWith('price_mock_')) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price: plan.gatewayPlanId,
              quantity: 1,
            },
          ],
          customer_email: client.email || undefined,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            tenantId,
            clientId,
            planId,
          },
          subscription_data: {
            metadata: {
              tenantId,
              clientId,
              planId,
            },
          },
        });

        return { url: session.url };
      } catch (err: any) {
        throw new BadRequestException(`Erro ao criar sessão no Stripe: ${err.message}`);
      }
    } else {
      // MOCK MODE: Retorna URL de sucesso simulada
      console.log(`[Simulação] Criando sessão de checkout simulada para o cliente ${client.nome} no plano ${plan.name}.`);
      
      // Gerar um ID de sessão fake
      const mockSessionId = `cs_mock_${Math.random().toString(36).substring(2, 12)}`;
      
      // URL de redirecionamento que inclui gatilho de simulação
      const mockRedirectUrl = `${origin}/feedback/client-portal?session_id=${mockSessionId}&checkout_status=success&mock_plan_id=${planId}&mock_client_id=${clientId}`;
      
      return { url: mockRedirectUrl };
    }
  }

  // Criar Link para o Customer Portal da Stripe
  async createPortalSession(gatewayCustomerId: string, origin: string) {
    if (this.stripe && gatewayCustomerId && !gatewayCustomerId.startsWith('cus_mock_')) {
      try {
        const session = await this.stripe.billingPortal.sessions.create({
          customer: gatewayCustomerId,
          return_url: `${origin}/feedback/client-portal`,
        });
        return { url: session.url };
      } catch (err: any) {
        throw new BadRequestException(`Erro ao abrir portal do Stripe: ${err.message}`);
      }
    } else {
      // Simulação
      return { url: `${origin}/feedback/client-portal?portal_status=simulated` };
    }
  }

  // Tratar Webhook oficial da Stripe
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe || !this.webhookSecret) {
      throw new BadRequestException('Configurações do webhook da Stripe incompletas no servidor.');
    }

    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err: any) {
      console.error(`Falha na validação de assinatura do Webhook: ${err.message}`);
      throw new BadRequestException(`Webhook Signature verification failed: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Evento recebido: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await this.processCheckoutSuccess(session);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        await this.processPaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        await this.processPaymentFailed(invoice);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await this.processSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`Evento ${event.type} ignorado.`);
    }

    return { received: true };
  }

  // 1. Processar sucesso no Checkout
  private async processCheckoutSuccess(session: any) {
    const metadata = session.metadata;
    if (!metadata || !metadata.clientId || !metadata.planId || !metadata.tenantId) {
      console.error('[Webhook Error] Checkout sem metadados válidos:', session.id);
      return;
    }

    const { clientId, planId, tenantId } = metadata;
    const gatewaySubscriptionId = session.subscription as string;
    const gatewayCustomerId = session.customer as string;

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return;

    // Verificar se já existe uma assinatura anterior do cliente para atualizá-la
    const existing = await this.prisma.subscription.findFirst({
      where: { clientId, planId },
    });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // Expiração de 1 mês

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          gatewaySubscriptionId,
          gatewayCustomerId,
          remainingCredits: plan.creditsPerMonth,
          expiresAt,
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          clientId,
          planId,
          status: 'ACTIVE',
          gatewaySubscriptionId,
          gatewayCustomerId,
          remainingCredits: plan.creditsPerMonth,
          expiresAt,
        },
      });
    }

    console.log(`[Billing] Cliente ${clientId} assinou o plano ${planId} com sucesso no Stripe.`);
  }

  // 2. Processar pagamento de fatura aprovada
  private async processPaymentSucceeded(invoice: any) {
    const gatewaySubscriptionId = invoice.subscription as string;
    if (!gatewaySubscriptionId) return;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewaySubscriptionId },
      include: { plan: true },
    });

    if (!subscription) return;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        remainingCredits: subscription.plan.creditsPerMonth,
        expiresAt,
      },
    });

    console.log(`[Billing] Assinatura renovada: ${subscription.id}`);
  }

  // 3. Processar falha de pagamento
  private async processPaymentFailed(invoice: any) {
    const gatewaySubscriptionId = invoice.subscription as string;
    if (!gatewaySubscriptionId) return;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewaySubscriptionId },
    });

    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
      },
    });

    console.warn(`[Billing] Assinatura em atraso por falha no pagamento: ${subscription.id}`);
  }

  // 4. Processar cancelamento no Stripe
  private async processSubscriptionDeleted(sub: any) {
    const gatewaySubscriptionId = sub.id;
    if (!gatewaySubscriptionId) return;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewaySubscriptionId },
    });

    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        expiresAt: new Date(), // Expira imediatamente
      },
    });

    console.log(`[Billing] Assinatura cancelada no Stripe: ${subscription.id}`);
  }

  // ATIVAÇÃO DIRETA SIMULADA (Para modo de simulação no local/desenvolvimento)
  async simulateSubscriptionActivation(clientId: string, planId: string, tenantId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, tenantId },
    });
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!plan || !client) {
      throw new BadRequestException('Plano ou cliente inválido.');
    }

    const mockSubId = `sub_mock_${Math.random().toString(36).substring(2, 9)}`;
    const mockCustId = `cus_mock_${Math.random().toString(36).substring(2, 9)}`;

    const existing = await this.prisma.subscription.findFirst({
      where: { clientId, planId },
    });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    if (existing) {
      return this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          gatewaySubscriptionId: mockSubId,
          gatewayCustomerId: mockCustId,
          remainingCredits: plan.creditsPerMonth,
          expiresAt,
        },
      });
    } else {
      return this.prisma.subscription.create({
        data: {
          clientId,
          planId,
          status: 'ACTIVE',
          gatewaySubscriptionId: mockSubId,
          gatewayCustomerId: mockCustId,
          remainingCredits: plan.creditsPerMonth,
          expiresAt,
        },
      });
    }
  }
}
