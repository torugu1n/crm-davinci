import { Controller, Post, Body, Headers, Req, HttpCode, HttpStatus, UseGuards, BadRequestException } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async checkout(@Body() body: any, @Req() req: any) {
    const clientId = req.user.id;
    const tenantId = req.user.tenantId;

    if (!body.planId || !body.origin) {
      throw new BadRequestException('ID do plano e origem são obrigatórios.');
    }

    return this.billingService.createCheckoutSession(clientId, body.planId, tenantId, body.origin);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async portal(@Body() body: any) {
    if (!body.gatewayCustomerId || !body.origin) {
      throw new BadRequestException('ID do cliente gateway e origem são obrigatórios.');
    }
    return this.billingService.createPortalSession(body.gatewayCustomerId, body.origin);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    if (!signature) {
      throw new BadRequestException('Assinatura do Stripe ausente no cabeçalho.');
    }
    if (!req.rawBody) {
      throw new BadRequestException('Corpo da requisição vazio. Verifique se o rawBody está ativado.');
    }
    return this.billingService.handleWebhook(req.rawBody, signature);
  }

  // ATIVAÇÃO DIRETA SIMULADA (Para modo de simulação no local/desenvolvimento)
  @Post('simulate-success')
  @UseGuards(JwtAuthGuard)
  async simulateSuccess(@Body() body: any, @Req() req: any) {
    const clientId = req.user.id;
    const tenantId = req.user.tenantId;

    if (!body.planId) {
      throw new BadRequestException('ID do plano é obrigatório.');
    }

    return this.billingService.simulateSubscriptionActivation(clientId, body.planId, tenantId);
  }
}
