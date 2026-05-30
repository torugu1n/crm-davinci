import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let subdomain = req.headers['x-tenant-subdomain'] as string;

    if (!subdomain) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      const baseDomain = process.env.BASE_DOMAIN || 'vtecsolutions.online';
      const basePartsCount = baseDomain.split('.').length;

      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
          subdomain = parts[0];
        }
      } else if (host.includes(baseDomain)) {
        if (parts.length > basePartsCount) {
          subdomain = parts[0];
        }
      } else {
        // Custom domain
        subdomain = host;
      }
    }

    if (subdomain) {
      const cleanSubdomain = subdomain.toLowerCase().trim();
      const baseDomain = process.env.BASE_DOMAIN || 'vtecsolutions.online';
      const baseDomainName = baseDomain.split('.')[0];
      const ignoredSubdomains = ['www', 'app', baseDomainName, 'localhost', '127', '127.0.0.1'];

      if (!ignoredSubdomains.includes(cleanSubdomain)) {
        const tenant = await this.prisma.tenant.findFirst({
          where: {
            OR: [
              { subdomain: cleanSubdomain },
              { customDomain: cleanSubdomain },
            ],
          },
        });
        if (tenant) {
          req['tenant'] = tenant;
        }
      }
    }
    next();
  }
}
