import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }
    return tenant;
  }

  async findBySubdomain(subdomain: string) {
    const clean = subdomain.toLowerCase().trim();
    return this.prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain: clean },
          { customDomain: clean }
        ]
      }
    });
  }

  async create(data: any) {
    if (!data.name || !data.subdomain) {
      throw new BadRequestException('Nome e subdomínio são obrigatórios');
    }

    const subdomain = data.subdomain.toLowerCase().trim();
    
    // Check uniqueness
    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain },
          data.customDomain ? { customDomain: data.customDomain.toLowerCase().trim() } : undefined
        ].filter(Boolean) as any
      }
    });

    if (existing) {
      throw new BadRequestException('Um estabelecimento com este subdomínio ou domínio personalizado já existe.');
    }

    return this.prisma.tenant.create({
      data: {
        name: data.name,
        subdomain,
        customDomain: data.customDomain ? data.customDomain.toLowerCase().trim() : null,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || '#C5A880',
        secondaryColor: data.secondaryColor || '#18181b',
      },
    });
  }

  async update(id: string, data: any) {
    const tenant = await this.findOne(id);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.secondaryColor !== undefined) updateData.secondaryColor = data.secondaryColor;

    if (data.subdomain !== undefined) {
      const subdomain = data.subdomain.toLowerCase().trim();
      if (subdomain !== tenant.subdomain) {
        const existing = await this.prisma.tenant.findUnique({
          where: { subdomain },
        });
        if (existing) {
          throw new BadRequestException('Este subdomínio já está em uso.');
        }
        updateData.subdomain = subdomain;
      }
    }

    if (data.customDomain !== undefined) {
      const customDomain = data.customDomain ? data.customDomain.toLowerCase().trim() : null;
      if (customDomain !== tenant.customDomain) {
        if (customDomain) {
          const existing = await this.prisma.tenant.findUnique({
            where: { customDomain },
          });
          if (existing) {
            throw new BadRequestException('Este domínio personalizado já está em uso.');
          }
        }
        updateData.customDomain = customDomain;
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
