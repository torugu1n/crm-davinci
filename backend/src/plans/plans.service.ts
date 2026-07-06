import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import Stripe = require('stripe');

@Injectable()
export class PlansService {
  private stripe: any = null;

  constructor(private prisma: PrismaService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && stripeKey !== 'your_stripe_secret_key_here') {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16' as any,
      });
    } else {
      console.warn('STRIPE_SECRET_KEY não configurada ou inválida. O PlansService operará em modo de simulação.');
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.plan.findMany({
      where: {
        tenantId,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, tenantId },
    });
    if (!plan) {
      throw new NotFoundException('Plano de assinatura não encontrado.');
    }
    return plan;
  }

  async create(data: any, tenantId: string) {
    if (!data.name || !data.price) {
      throw new BadRequestException('Nome e preço são obrigatórios.');
    }

    const priceInCentavos = Math.round(data.price * 100);
    let gatewayPlanId = `price_mock_${Math.random().toString(36).substring(2, 9)}`;

    if (this.stripe) {
      try {
        // Criar produto no Stripe
        const product = await this.stripe.products.create({
          name: `${data.name} - ${tenantId.substring(0, 8)}`,
          description: data.description || undefined,
          metadata: {
            tenantId,
          },
        });

        // Criar preço recorrente no Stripe
        const price = await this.stripe.prices.create({
          product: product.id,
          unit_amount: priceInCentavos,
          currency: 'brl',
          recurring: {
            interval: 'month',
          },
          metadata: {
            tenantId,
          },
        });

        gatewayPlanId = price.id;
      } catch (err: any) {
        throw new BadRequestException(`Erro ao registrar plano no Stripe: ${err.message}`);
      }
    }

    return this.prisma.plan.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        creditsPerMonth: data.creditsPerMonth ? parseInt(data.creditsPerMonth, 10) : 0,
        gatewayPlanId,
        tenantId,
      },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    const plan = await this.findOne(id, tenantId);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.active !== undefined) updateData.active = data.active;

    // Nota: O preço recorrente no Stripe é imutável após criado.
    // Alterações de preço devem ser feitas criando um novo plano.

    return this.prisma.plan.update({
      where: { id: plan.id },
      data: updateData,
    });
  }

  async delete(id: string, tenantId: string) {
    const plan = await this.findOne(id, tenantId);

    // Verificar se há assinaturas ativas vinculadas a este plano
    const activeSubs = await this.prisma.subscription.count({
      where: {
        planId: plan.id,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
    });

    if (activeSubs > 0) {
      throw new BadRequestException(
        'Este plano possui assinaturas ativas de clientes e não pode ser excluído. Desative-o ao invés de excluir.'
      );
    }

    // Se houver Stripe integrado, podemos desativar o preço/produto lá
    if (this.stripe && plan.gatewayPlanId && !plan.gatewayPlanId.startsWith('price_mock_')) {
      try {
        const price = await this.stripe.prices.retrieve(plan.gatewayPlanId);
        if (price.product) {
          await this.stripe.products.update(price.product as string, { active: false });
        }
      } catch (err) {
        console.error('Erro ao arquivar produto no Stripe:', err);
      }
    }

    return this.prisma.plan.update({
      where: { id: plan.id },
      data: { active: false },
    });
  }
}
