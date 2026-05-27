import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    
    // 1. If super admin is acting on behalf of a specific tenant
    const user = request.user;
    if (user && (user.role === 'SUPER_ADMIN' || (user.roles && user.roles.includes('SUPER_ADMIN')))) {
      const tenantIdHeader = request.headers['x-tenant-id'] || request.query['tenantId'];
      if (tenantIdHeader) return tenantIdHeader as string;
    }
    
    // 2. User's own tenantId from authenticated JWT session
    if (user && user.tenantId) {
      return user.tenantId;
    }
    
    // 3. Subdomain-resolved tenant ID from the middleware/request context
    if (request.tenant && request.tenant.id) {
      return request.tenant.id;
    }
    
    // Fallback: Check header directly in case middleware was bypassed
    const tenantIdHeaderDirect = request.headers['x-tenant-id'] || request.headers['x-tenant-subdomain'];
    if (tenantIdHeaderDirect) {
      return tenantIdHeaderDirect as string;
    }

    return null;
  },
);

export const ActiveTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant || null;
  },
);
