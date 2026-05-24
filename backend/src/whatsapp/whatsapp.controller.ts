import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('history/:clientId')
  async getHistory(@Param('clientId') clientId: string) {
    return this.whatsappService.getChatHistory(clientId);
  }

  @Post('customer')
  async receiveMessage(@Body() body: any) {
    return this.whatsappService.receiveCustomerMessage(body.clientId, body.mensagem);
  }

  @Post('operator')
  async sendMessage(@Body() body: any) {
    return this.whatsappService.sendOperatorMessage(body.clientId, body.mensagem);
  }

  @Post('webhook/:event?')
  async handleWebhook(@Body() body: any) {
    return this.whatsappService.handleEvolutionWebhook(body);
  }

  @Get('debug-integration')
  async debugIntegration() {
    return this.whatsappService.debugIntegration();
  }
}
