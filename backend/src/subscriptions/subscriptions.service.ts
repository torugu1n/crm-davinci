import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.subscription.findMany({
      where: {
        client: {
          tenantId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            creditsPerMonth: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        id,
        client: {
          tenantId,
        },
      },
      include: {
        client: true,
        plan: true,
      },
    });

    if (!sub) {
      throw new NotFoundException('Assinatura não encontrada para este estabelecimento.');
    }

    return sub;
  }

  async findClientSubscription(clientId: string, tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        clientId,
        client: {
          tenantId,
        },
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deductCredit(id: string, tenantId: string) {
    const sub = await this.findOne(id, tenantId);

    if (sub.status !== 'ACTIVE' && sub.status !== 'TRIALING') {
      throw new BadRequestException('A assinatura não está ativa.');
    }

    // Se o plano tiver limite de créditos (créditos > 0)
    if (sub.plan.creditsPerMonth > 0) {
      if (sub.remainingCredits <= 0) {
        throw new BadRequestException('O cliente já consumiu todos os créditos mensais desta assinatura.');
      }

      return this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          remainingCredits: sub.remainingCredits - 1,
        },
        include: {
          client: true,
          plan: true,
        },
      });
    }

    // Se for ilimitado (creditsPerMonth === 0)
    return sub;
  }

  // Obter métricas de MRR e Churn para o dono do estabelecimento
  async getMetrics(tenantId: string) {
    const activeSubs = await this.prisma.subscription.findMany({
      where: {
        client: {
          tenantId,
        },
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: {
        plan: true,
      },
    });

    const mrr = activeSubs.reduce((acc, sub) => acc + sub.plan.price, 0);

    const totalCanceledThisMonth = await this.prisma.subscription.count({
      where: {
        client: {
          tenantId,
        },
        status: 'CANCELED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const totalSubs = await this.prisma.subscription.count({
      where: {
        client: {
          tenantId,
        },
      },
    });

    const churnRate = totalSubs > 0 ? (totalCanceledThisMonth / totalSubs) * 100 : 0;
 
     return {
       activeSubscribers: activeSubs.length,
       mrr,
       churnRate: parseFloat(churnRate.toFixed(2)),
     };
   }

  async subscribe(clientId: string, planId: string, cardDetails: any, tenantId: string) {
    if (!planId) {
      throw new BadRequestException('ID do plano é obrigatório.');
    }
    if (!cardDetails || !cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiry || !cardDetails.cvv) {
      throw new BadRequestException('Dados do cartão de crédito são obrigatórios para a assinatura.');
    }

    // Verify plan
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, tenantId, active: true },
    });
    if (!plan) {
      throw new NotFoundException('Plano de assinatura não encontrado ou inativo.');
    }

    // Check if client already has an active subscription
    const existingActive = await this.prisma.subscription.findFirst({
      where: {
        clientId,
        status: { in: ['ACTIVE', 'TRIALING'] },
        expiresAt: { gte: new Date() },
      },
    });

    if (existingActive) {
      throw new BadRequestException('Você já possui uma assinatura ativa para este estabelecimento.');
    }

    // Save progressive billing/compliance profile on client
    const updatedClient = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        cpf: cardDetails.cpf || undefined,
        email: cardDetails.email || undefined,
        addressZip: cardDetails.addressZip || undefined,
        addressStreet: cardDetails.addressStreet || undefined,
        addressNumber: cardDetails.addressNumber || undefined,
        addressCity: cardDetails.addressCity || undefined,
        addressState: cardDetails.addressState || undefined,
      },
      include: {
        tenant: true
      }
    });

    const tenant = updatedClient.tenant;
    const apiKey = tenant?.gatewayApiKey;
    const provider = tenant?.gatewayProvider;

    let gatewaySubId = `sub_mock_${Math.random().toString(36).substring(2, 9)}`;
    let gatewayCusId = `cus_mock_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month duration

    if (provider === 'ASAAS' && apiKey) {
      const isProduction = apiKey.startsWith('$aae.');
      const baseUrl = isProduction ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';

      try {
        // 1. Search or create customer on Asaas
        let asaasCustomerId: string = null;
        const cleanCpf = cardDetails.cpf ? cardDetails.cpf.replace(/\D/g, '') : '';
        console.log('[Asaas Debug] Buscando cliente por CPF no Asaas:', cleanCpf);
        if (cleanCpf) {
          const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanCpf}`, {
            headers: { 'access_token': apiKey }
          });
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            console.log('[Asaas Debug] Resposta de busca de cliente:', JSON.stringify(searchData, null, 2));
            if (searchData.data && searchData.data.length > 0) {
              asaasCustomerId = searchData.data[0].id;
              console.log('[Asaas Debug] Cliente encontrado ID:', asaasCustomerId);
            }
          } else {
            console.error('[Asaas Debug] Erro ao buscar cliente. Status:', searchRes.status, await searchRes.text());
          }
        }

        if (asaasCustomerId) {
          // Update customer on Asaas to ensure they have the CPF/CNPJ and latest billing info
          console.log('[Asaas Debug] Atualizando cliente existente no Asaas ID:', asaasCustomerId);
          const cleanPhone = updatedClient.telefone.replace(/\D/g, '');
          const updateCustRes = await fetch(`${baseUrl}/customers/${asaasCustomerId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey
            },
            body: JSON.stringify({
              name: updatedClient.nome,
              email: updatedClient.email || cardDetails.email,
              phone: cleanPhone,
              cpfCnpj: cardDetails.cpf.replace(/\D/g, ''),
              postalCode: cardDetails.addressZip.replace(/\D/g, ''),
              address: cardDetails.addressStreet,
              addressNumber: cardDetails.addressNumber,
              province: 'Centro',
            })
          });

          if (!updateCustRes.ok) {
            const errText = await updateCustRes.text();
            console.error('[Asaas Debug] Erro ao atualizar cliente no Asaas. Status:', updateCustRes.status, errText);
            const errData = JSON.parse(errText).catch(() => ({}));
            const errMsg = errData.errors?.[0]?.description || 'Erro ao atualizar dados do cliente no Asaas.';
            throw new BadRequestException(errMsg);
          } else {
            console.log('[Asaas Debug] Cliente atualizado com sucesso no Asaas.');
          }
        } else {
          console.log('[Asaas Debug] Criando novo cliente no Asaas para CPF:', cleanCpf);
          const cleanPhone = updatedClient.telefone.replace(/\D/g, '');
          const createCustRes = await fetch(`${baseUrl}/customers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey
            },
            body: JSON.stringify({
              name: updatedClient.nome,
              email: updatedClient.email || cardDetails.email,
              phone: cleanPhone,
              cpfCnpj: cardDetails.cpf.replace(/\D/g, ''),
              postalCode: cardDetails.addressZip.replace(/\D/g, ''),
              address: cardDetails.addressStreet,
              addressNumber: cardDetails.addressNumber,
              province: 'Centro', // Fallback district required by Asaas sometimes
            })
          });

          if (!createCustRes.ok) {
            const errText = await createCustRes.text();
            console.error('[Asaas Debug] Erro ao cadastrar cliente no Asaas. Status:', createCustRes.status, errText);
            const errData = JSON.parse(errText).catch(() => ({}));
            const errMsg = errData.errors?.[0]?.description || 'Erro ao cadastrar cliente no Asaas.';
            throw new BadRequestException(errMsg);
          }

          const custData = await createCustRes.json();
          asaasCustomerId = custData.id;
          console.log('[Asaas Debug] Novo cliente criado com sucesso no Asaas ID:', asaasCustomerId);
        }

        // 2. Create monthly subscription on Asaas
        const [expiryMonth, expiryYear] = cardDetails.expiry.split('/');
        const fullYear = `20${expiryYear}`;
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 1); // charge starts tomorrow
        const formattedDate = nextDueDate.toISOString().split('T')[0];

        const subPayload = {
          customer: asaasCustomerId,
          billingType: 'CREDIT_CARD',
          value: plan.price,
          nextDueDate: formattedDate,
          cycle: 'MONTHLY',
          description: `Assinatura ${plan.name} - Venusta`,
          creditCard: {
            holderName: cardDetails.cardName,
            number: cardDetails.cardNumber.replace(/\D/g, ''),
            expiryMonth,
            expiryYear: fullYear,
            ccv: cardDetails.cvv
          },
          creditCardHolderInfo: {
            name: cardDetails.cardName,
            email: updatedClient.email || cardDetails.email,
            cpfCnpj: cardDetails.cpf.replace(/\D/g, ''),
            postalCode: cardDetails.addressZip.replace(/\D/g, ''),
            addressNumber: cardDetails.addressNumber,
            phone: updatedClient.telefone.replace(/\D/g, '')
          }
        };

        console.log('[Asaas Debug] Criando assinatura no Asaas. Payload:', JSON.stringify(subPayload, null, 2));

        const createSubRes = await fetch(`${baseUrl}/subscriptions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey
          },
          body: JSON.stringify(subPayload)
        });

        if (!createSubRes.ok) {
          const errText = await createSubRes.text();
          console.error('[Asaas Debug] Erro ao criar assinatura no Asaas. Status:', createSubRes.status, errText);
          const errData = JSON.parse(errText);
          const errMsg = errData.errors?.[0]?.description || 'Erro ao criar assinatura no Asaas. Verifique os dados do cartão.';
          throw new BadRequestException(errMsg);
        }

        const subData = await createSubRes.json();
        console.log('[Asaas Debug] Assinatura criada com sucesso no Asaas ID:', subData.id);
        gatewaySubId = subData.id;
        gatewayCusId = asaasCustomerId;
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(err.message || 'Falha de comunicação com o provedor de pagamento.');
      }
    }

    return this.prisma.subscription.create({
      data: {
        clientId,
        planId: plan.id,
        status: 'ACTIVE',
        remainingCredits: plan.creditsPerMonth,
        gatewaySubscriptionId: gatewaySubId,
        gatewayCustomerId: gatewayCusId,
        expiresAt,
      },
      include: {
        plan: true,
      },
    });
  }

  async cancel(subscriptionId: string, clientId: string, tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        clientId,
        client: { tenantId }
      },
      include: {
        client: { include: { tenant: true } }
      }
    });

    if (!sub) {
      throw new NotFoundException('Assinatura não encontrada.');
    }

    const tenant = sub.client.tenant;
    const apiKey = tenant?.gatewayApiKey;
    const provider = tenant?.gatewayProvider;

    if (provider === 'ASAAS' && apiKey && sub.gatewaySubscriptionId && !sub.gatewaySubscriptionId.startsWith('sub_mock_')) {
      const isProduction = apiKey.startsWith('$aae.');
      const baseUrl = isProduction ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';

      try {
        await fetch(`${baseUrl}/subscriptions/${sub.gatewaySubscriptionId}`, {
          method: 'DELETE',
          headers: { 'access_token': apiKey }
        });
      } catch (err) {
        console.error('Erro ao cancelar assinatura no Asaas:', err);
      }
    }

    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'CANCELED'
      },
      include: {
        plan: true
      }
    });
  }

  async handleWebhook(tenantId: string, body: any, signature: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }

    // Verify signature if configured
    if (tenant.gatewayWebhookSecret && tenant.gatewayWebhookSecret !== '') {
      if (signature !== tenant.gatewayWebhookSecret) {
        throw new UnauthorizedException('Assinatura do webhook inválida.');
      }
    }

    console.log(`[Asaas Webhook] Evento recebido: ${body.event} para o tenant: ${tenant.name}`);

    const subscriptionId = body.subscription;
    if (!subscriptionId) {
      return { success: true, message: 'Nenhum ID de assinatura no payload' };
    }

    const localSub = await this.prisma.subscription.findFirst({
      where: {
        gatewaySubscriptionId: subscriptionId,
        client: { tenantId }
      }
    });

    if (!localSub) {
      console.warn(`[Asaas Webhook] Assinatura ${subscriptionId} não encontrada localmente no tenant ${tenantId}`);
      return { success: true, message: 'Assinatura não cadastrada no CRM' };
    }

    if (body.event === 'PAYMENT_CONFIRMED' || body.event === 'PAYMENT_RECEIVED') {
      const newExpiresAt = new Date();
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);

      await this.prisma.subscription.update({
        where: { id: localSub.id },
        data: {
          status: 'ACTIVE',
          expiresAt: newExpiresAt
        }
      });
      console.log(`[Asaas Webhook] Assinatura ${localSub.id} renovada até ${newExpiresAt}`);
    } else if (body.event === 'SUBSCRIPTION_DELETED' || body.event === 'SUBSCRIPTION_CANCELLED' || body.event === 'PAYMENT_OVERDUE') {
      await this.prisma.subscription.update({
        where: { id: localSub.id },
        data: {
          status: 'CANCELED'
        }
      });
      console.log(`[Asaas Webhook] Assinatura ${localSub.id} cancelada via provedor.`);
    }

    return { success: true };
  }
}
