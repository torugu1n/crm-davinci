import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class TenantOrSuperAdminAuthGuard extends AuthGuard(['jwt', 'superadmin-jwt']) {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Tenta autenticar usando qualquer uma das duas estratégias registradas
    const result = await super.canActivate(context);
    if (!result) return false;

    return true;
  }
}
