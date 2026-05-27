import { Controller, Post, Body, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ActiveTenantId } from './tenant.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateStaff(body.email, body.senha);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.staffLogin(user);
  }

  @Post('client')
  async clientLogin(@Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.authService.clientLogin(body.nome, body.telefone, body.aniversario, tenantId);
  }

  @Post('seed-demo')
  async seedDemo(@Query('key') key: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    const seedKey = process.env.DEMO_SEED_KEY;

    if (isProduction && !seedKey) {
      throw new UnauthorizedException('Semeadura desativada em produção sem uma chave definida.');
    }

    const expectedKey = seedKey || 'davinciseed';

    if (key !== expectedKey) {
      throw new UnauthorizedException('Chave de segurança inválida para semeadura.');
    }
    return this.authService.seedDemoData();
  }
}
