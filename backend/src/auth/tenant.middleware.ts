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
      // Support domains like: tenant.vtecsolutions.online or tenant.localhost:3000
      if (parts.length > 2 && !host.includes('localhost')) {
        subdomain = parts[0];
      } else if (host.includes('localhost') && parts.length > 1) {
        subdomain = parts[0];
      }
    }

    if (subdomain) {
      const cleanSubdomain = subdomain.toLowerCase().trim();
      const ignoredSubdomains = ['www', 'app', 'vtecsolutions', 'localhost', '127', '127.0.0.1'];
      
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
