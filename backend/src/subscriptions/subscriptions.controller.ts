import { Controller, Get, Post, Param, Body, Request, UseGuards, Headers } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subsService: SubscriptionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async findAll(@ActiveTenantId() tenantId: string) {
    return this.subsService.findAll(tenantId);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getMetrics(@ActiveTenantId() tenantId: string) {
    return this.subsService.getMetrics(tenantId);
  }

  @Get('client/:clientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async findClientSubscription(@Param('clientId') clientId: string, @ActiveTenantId() tenantId: string) {
    return this.subsService.findClientSubscription(clientId, tenantId);
  }

  @Post(':id/deduct-credit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async deductCredit(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.subsService.deductCredit(id, tenantId);
  }

  // Client routes
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'ADMIN', 'SUPER_ADMIN')
  async getMySubscription(@Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.subsService.findClientSubscription(req.user.id, tenantId);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'ADMIN', 'SUPER_ADMIN')
  async subscribe(@Request() req: any, @Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.subsService.subscribe(req.user.id, body.planId, body.cardDetails, tenantId);
  }

  @Post('cancel/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'ADMIN', 'SUPER_ADMIN')
  async cancel(@Param('id') id: string, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.subsService.cancel(id, req.user.id, tenantId);
  }

  // Public webhook route (not protected by JwtAuthGuard)
  @Post('webhook/:tenantId')
  async handleWebhook(
    @Param('tenantId') tenantId: string,
    @Body() body: any,
    @Headers('asaas-signature') signature: string
  ) {
    return this.subsService.handleWebhook(tenantId, body, signature);
  }
}
