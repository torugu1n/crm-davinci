import { Controller, Get, Post, Body, Param, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('history/:clientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE')
  async getHistory(@Param('clientId') clientId: string) {
    return this.whatsappService.getChatHistory(clientId);
  }

  @Post('customer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE')
  async receiveMessage(@Body() body: any) {
    return this.whatsappService.receiveCustomerMessage(body.clientId, body.mensagem);
  }

  @Post('operator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE')
  async sendMessage(@Body() body: any) {
    return this.whatsappService.sendOperatorMessage(body.clientId, body.mensagem);
  }

  @Post('webhook/:event?')
  async handleWebhook(@Query('token') token: string, @Body() body: any) {
    const webhookSecret = process.env.WEBHOOK_SECRET_KEY;
    if (webhookSecret && token !== webhookSecret) {
      throw new UnauthorizedException('Token de segurança do Webhook inválido ou ausente.');
    }
    return this.whatsappService.handleEvolutionWebhook(body);
  }

  @Get('debug-integration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT')
  async debugIntegration() {
    return this.whatsappService.debugIntegration();
  }
}
