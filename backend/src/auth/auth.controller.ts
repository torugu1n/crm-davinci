import { Controller, Post, Body, Query, UnauthorizedException, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ActiveTenantId } from './tenant.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();

  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any, @Request() req: any) {
    this.checkRateLimit(`staff:${req.ip}:${String(body.email || '').toLowerCase()}`, 10, 15 * 60 * 1000);
    const user = await this.authService.validateStaff(body.email, body.senha);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.staffLogin(user);
  }

  @Post('client')
  async clientLogin(@Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    this.checkRateLimit(`client:${req.ip}:${String(body.telefone || '')}`, 6, 15 * 60 * 1000);
    return this.authService.clientLogin(body.nome, body.telefone, body.aniversario, tenantId);
  }

  @Post('seed-demo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async seedDemo(@Query('key') key: string) {
    const seedKey = process.env.DEMO_SEED_KEY;

    if (!seedKey) {
      throw new UnauthorizedException('Semeadura desativada sem uma chave definida.');
    }

    if (key !== seedKey) {
      throw new UnauthorizedException('Chave de segurança inválida para semeadura.');
    }
    return this.authService.seedDemoData();
  }

  private checkRateLimit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const current = this.attempts.get(key);
    if (!current || current.resetAt < now) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    if (current.count >= limit) {
      throw new HttpException('Muitas tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }
    current.count += 1;
  }
}
