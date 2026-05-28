import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        users: {
          where: {
            role: 'ADMIN',
          },
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          where: {
            role: 'ADMIN',
          },
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
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
    
    // Check uniqueness of tenant
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

    // Validate admin credentials if provided
    let hashedPassword = '';
    let email = '';
    if (data.adminEmail && data.adminPassword) {
      email = data.adminEmail.toLowerCase().trim();
      const existingUser = await this.prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        throw new BadRequestException('Já existe um usuário cadastrado com este e-mail.');
      }
      hashedPassword = await bcrypt.hash(data.adminPassword, 10);
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        subdomain,
        customDomain: data.customDomain ? data.customDomain.toLowerCase().trim() : null,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || '#C5A880',
        secondaryColor: data.secondaryColor || '#18181b',
      },
    });

    if (email && hashedPassword) {
      try {
        await this.prisma.user.create({
          data: {
            nome: data.adminName || data.name,
            email,
            senha: hashedPassword,
            role: 'ADMIN',
            roles: ['ADMIN'],
            tenantId: tenant.id,
          }
        });
      } catch (err: any) {
        // Rollback tenant creation on user create failure
        await this.prisma.tenant.delete({ where: { id: tenant.id } });
        throw new BadRequestException('Falha ao registrar conta de administrador do estabelecimento: ' + err.message);
      }
    }

    return tenant;
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

    const existingAdmin = (tenant as any).users?.[0];

    if (data.adminEmail || data.adminPassword || data.adminName) {
      if (existingAdmin) {
        const userUpdateData: any = {};
        if (data.adminName !== undefined) userUpdateData.nome = data.adminName;
        
        if (data.adminEmail !== undefined) {
          const email = data.adminEmail.toLowerCase().trim();
          if (email !== existingAdmin.email) {
            const existingUser = await this.prisma.user.findUnique({
              where: { email },
            });
            if (existingUser) {
              throw new BadRequestException('Já existe um usuário cadastrado com este e-mail.');
            }
            userUpdateData.email = email;
          }
        }

        if (data.adminPassword) {
          userUpdateData.senha = await bcrypt.hash(data.adminPassword, 10);
        }

        if (Object.keys(userUpdateData).length > 0) {
          await this.prisma.user.update({
            where: { id: existingAdmin.id },
            data: userUpdateData,
          });
        }
      } else {
        if (!data.adminEmail || !data.adminPassword) {
          throw new BadRequestException('Para cadastrar o administrador principal deste estabelecimento, o e-mail e a senha são obrigatórios.');
        }

        const email = data.adminEmail.toLowerCase().trim();
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });
        if (existingUser) {
          throw new BadRequestException('Já existe um usuário cadastrado com este e-mail.');
        }

        const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
        await this.prisma.user.create({
          data: {
            nome: data.adminName || data.name || tenant.name,
            email,
            senha: hashedPassword,
            role: 'ADMIN',
            roles: ['ADMIN'],
            tenantId: tenant.id,
          },
        });
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
