import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SuperAdminJwtAuthGuard extends AuthGuard('superadmin-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
