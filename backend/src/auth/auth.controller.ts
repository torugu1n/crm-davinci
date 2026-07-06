import { Controller, Post, Body, Query, UnauthorizedException, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ActiveTenantId } from './tenant.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { EmailVerificationService } from './email-verification.service';

@Controller('auth')
export class AuthController {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private authService: AuthService,
    private emailVerificationService: EmailVerificationService
  ) {}

  @Post('send-verification-email')
  async sendVerificationEmail(@Body() body: { email: string }, @Request() req: any) {
    this.checkRateLimit(`send-email:${req.ip}:${String(body.email || '').toLowerCase()}`, 5, 15 * 60 * 1000);
    return this.emailVerificationService.sendCode(body.email);
  }

  @Post('verify-verification-code')
  async verifyVerificationCode(@Body() body: { email: string; code: string }, @Request() req: any) {
    this.checkRateLimit(`verify-code:${req.ip}:${String(body.email || '').toLowerCase()}`, 10, 15 * 60 * 1000);
    const isValid = await this.emailVerificationService.verifyCode(body.email, body.code);
    if (!isValid) {
      throw new UnauthorizedException('Código de verificação inválido ou expirado');
    }
    return { success: true };
  }

  @Post('register')
  async register(@Body() body: any, @Request() req: any) {
    this.checkRateLimit(`register:${req.ip}:${String(body.email || '').toLowerCase()}`, 10, 15 * 60 * 1000);
    return this.authService.registerAdmin(body);
  }

  @Post('login')
  async login(@Body() body: any, @Request() req: any) {
    this.checkRateLimit(`staff:${req.ip}:${String(body.email || '').toLowerCase()}`, 10, 15 * 60 * 1000);
    const user = await this.authService.validateStaff(body.email, body.senha);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const currentTenant = req.tenant;
    if (currentTenant) {
      const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user.roles && user.roles.includes('SUPER_ADMIN'));

      if (currentTenant.subdomain !== 'venusta' && currentTenant.subdomain !== 'davinci') {
        if (isSuperAdmin) {
          throw new UnauthorizedException('Super administrador não tem permissão para acessar portais de estabelecimentos parceiros.');
        }
        if (user.tenantId !== currentTenant.id) {
          throw new UnauthorizedException('Usuário não pertence a este estabelecimento.');
        }
      }
    }

    return this.authService.staffLogin(user);
  }

  @Post('superadmin/login')
  async superAdminLogin(@Body() body: any, @Request() req: any) {
    this.checkRateLimit(`superadmin:${req.ip}:${String(body.email || '').toLowerCase()}`, 5, 15 * 60 * 1000);
    
    const user = await this.authService.validateStaff(body.email, body.senha);
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Credenciais inválidas de super-admin');
    }

    return this.authService.superAdminLogin(user);
  }

  @Post('client')
  async clientLogin(@Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    this.checkRateLimit(`client:${req.ip}:${String(body.telefone || '')}`, 6, 15 * 60 * 1000);
    return this.authService.clientLogin(body.nome, body.telefone, body.aniversario, tenantId);
  }

  @Post('request-otp')
  async requestOtp(@Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    this.checkRateLimit(`otp-req:${req.ip}:${String(body.telefone || '')}`, 10, 5 * 60 * 1000);
    return this.authService.requestOtp(body.nome, body.telefone, body.aniversario, tenantId);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    this.checkRateLimit(`otp-ver:${req.ip}:${String(body.telefone || '')}`, 10, 5 * 60 * 1000);
    return this.authService.verifyOtp(body.telefone, body.code, tenantId);
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
