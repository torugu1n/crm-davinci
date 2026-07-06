import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SystemSettingsService } from '../settings/system-settings.service';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SystemSettingsService
  ) {}

  async sendCode(email: string): Promise<{ success: boolean; simulated?: boolean; code?: string }> {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('E-mail inválido');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.emailVerification.create({
      data: {
        email: email.toLowerCase().trim(),
        code,
        expiresAt,
      },
    });

    const apiKey = await this.settingsService.getSetting('RESEND_API_KEY');
    const fromEmail = await this.settingsService.getSetting('RESEND_FROM_EMAIL');

    if (!apiKey) {
      this.logger.warn(`RESEND_API_KEY não configurada. MODO SIMULADO: Código de verificação para ${email} é ${code}`);
      return { success: true, simulated: true, code };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail || 'onboarding@resend.dev',
          to: email,
          subject: 'Seu código de verificação Venusta',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <h2 style="color: #C5A880; text-align: center;">Venusta</h2>
              <p>Olá,</p>
              <p>Obrigado por iniciar sua jornada com a Venusta. Use o código de verificação abaixo para confirmar seu e-mail e continuar seu cadastro:</p>
              <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-radius: 4px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #18181b; margin: 20px 0;">
                ${code}
              </div>
              <p style="font-size: 12px; color: #666; text-align: center;">Este código expira em 15 minutos. Se você não solicitou este código, por favor desconsidere este e-mail.</p>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 11px; color: #999; text-align: center;">Criado por VTRX Solutions</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Erro ao enviar e-mail via Resend: ${errText}`);
        throw new Error(`Erro na API do Resend: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Falha no envio de e-mail para ${email}: ${error.message}`);
      this.logger.warn(`Erro no envio real. MODO SIMULADO ATIVADO (Fallback): Código para ${email} é ${code}`);
      return { success: true, simulated: true, code };
    }
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    if (!email || !code) return false;
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    const record = await this.prisma.emailVerification.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!record) return false;

    await this.prisma.emailVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return true;
  }
}
