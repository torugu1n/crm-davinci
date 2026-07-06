import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TenantSubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Exempt public auth, webhook, onboarding and public endpoints
    const path = request.url;
    if (
      path.includes('/auth/') || 
      path.includes('/tenants/saas-webhook') || 
      path.includes('/tenants/public/') || 
      path.includes('/onboarding')
    ) {
      return true;
    }

    let user = request.user;
    
    // Fallback: decode JWT from Authorization header if not yet populated by guard
    if (!user && request.headers.authorization) {
      try {
        const parts = request.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
          const token = parts[1];
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
            user = {
              role: decoded.role,
              roles: decoded.roles || [decoded.role]
            };
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Super admins are exempt from subscription checks
    if (user && (user.role === 'SUPER_ADMIN' || (user.roles && user.roles.includes('SUPER_ADMIN')))) {
      return true;
    }

    const tenant = request.tenant;
    if (!tenant) {
      return true;
    }

    // If tenant active status is false, block access completely
    if (!tenant.active) {
      throw new HttpException('Estabelecimento desativado pelo administrador da plataforma.', HttpStatus.FORBIDDEN);
    }

    const status = tenant.subscriptionStatus || 'TRIAL';

    if (status === 'ACTIVE') {
      return true;
    }

    if (status === 'TRIAL') {
      const trialEndsAt = tenant.trialEndsAt;
      if (!trialEndsAt || new Date(trialEndsAt) > new Date()) {
        return true;
      }
      
      throw new HttpException(
        'Período de teste gratuito expirou. Regularize sua assinatura para continuar.', 
        HttpStatus.PAYMENT_REQUIRED
      );
    }

    throw new HttpException(
      `Sua assinatura está ${status === 'OVERDUE' ? 'atrasada' : 'cancelada'}. Regularize seu pagamento para continuar.`, 
      HttpStatus.PAYMENT_REQUIRED
    );
  }
}
