import { Controller, Get, Post, Put, Delete, Body, Param, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('history/:clientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'SUPER_ADMIN')
  async getHistory(@Param('clientId') clientId: string, @ActiveTenantId() tenantId: string) {
    return this.whatsappService.getChatHistory(clientId, tenantId);
  }

  @Post('customer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'SUPER_ADMIN')
  async receiveMessage(@Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.whatsappService.receiveCustomerMessage(body.clientId, body.mensagem, false, tenantId);
  }

  @Post('operator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'SUPER_ADMIN')
  async sendMessage(@Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.whatsappService.sendOperatorMessage(body.clientId, body.mensagem, tenantId);
  }

  @Post('webhook/:event?')
  async handleWebhook(
    @Query('token') token: string,
    @Query('tenantId') queryTenantId: string,
    @Body() body: any,
    @ActiveTenantId() headerTenantId: string,
  ) {
    const webhookSecret = process.env.WEBHOOK_SECRET_KEY || 'default_secret';
    if (token !== webhookSecret) {
      throw new UnauthorizedException('Token de segurança do Webhook inválido ou ausente.');
    }
    const finalTenantId = queryTenantId || headerTenantId || (body.instance && body.instance.startsWith('instance-') ? body.instance.replace('instance-', '') : null);
    if (!finalTenantId) {
      throw new UnauthorizedException('Tenant não identificado para o Webhook.');
    }
    return this.whatsappService.handleEvolutionWebhook(body, finalTenantId);
  }

  @Post('instance/connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async connectInstance(@ActiveTenantId() tenantId: string) {
    return this.whatsappService.connectInstance(tenantId);
  }

  @Post('instance/disconnect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async disconnectInstance(@ActiveTenantId() tenantId: string) {
    return this.whatsappService.disconnectInstance(tenantId);
  }

  @Get('instance/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async checkInstanceStatus(@ActiveTenantId() tenantId: string) {
    return this.whatsappService.checkInstanceStatus(tenantId);
  }

  @Post('instance/simulate-success')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async simulateSuccess(@ActiveTenantId() tenantId: string) {
    return this.whatsappService.simulateConnectionSuccess(tenantId);
  }

  @Get('debug-integration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async debugIntegration() {
    return this.whatsappService.debugIntegration();
  }

  @Get('quick-replies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'SUPER_ADMIN')
  async getQuickReplies(@ActiveTenantId() tenantId: string) {
    return this.whatsappService.getQuickReplies(tenantId);
  }

  @Post('quick-replies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async createQuickReply(@Body() body: { titulo: string; conteudo: string }, @ActiveTenantId() tenantId: string) {
    return this.whatsappService.createQuickReply(body, tenantId);
  }

  @Delete('quick-replies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async deleteQuickReply(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.whatsappService.deleteQuickReply(id, tenantId);
  }

  @Put('quick-replies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async updateQuickReply(@Param('id') id: string, @Body() body: { titulo: string; conteudo: string }, @ActiveTenantId() tenantId: string) {
    return this.whatsappService.updateQuickReply(id, body, tenantId);
  }
}
