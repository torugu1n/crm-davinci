import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SystemSettingsService } from '../settings/system-settings.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SystemSettingsService
  ) {}

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

  private validateSubdomainFormat(subdomain: string) {
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      throw new BadRequestException('O subdomínio deve conter apenas letras minúsculas, números e hífens.');
    }

    const baseDomain = process.env.BASE_DOMAIN || 'appvenusta.com.br';
    const baseDomainName = baseDomain.split('.')[0].toLowerCase();
    
    const reserved = [
      'www', 'app', 'superadmin', 'admin', 'localhost', '127', '127.0.0.1', 
      'davinci', 'venusta', 'api', 'auth', 'mail', 'test', 'dev', 'prod', 'staging',
      baseDomainName
    ];

    if (reserved.includes(subdomain)) {
      throw new BadRequestException(`O subdomínio "${subdomain}" é reservado pelo sistema e não pode ser utilizado.`);
    }
  }

  async create(data: any) {
    if (!data.name || !data.subdomain) {
      throw new BadRequestException('Nome e subdomínio são obrigatórios');
    }

    if (data.requireEmailVerification && data.adminEmail) {
      const email = data.adminEmail.toLowerCase().trim();
      const verification = await this.prisma.emailVerification.findFirst({
        where: {
          email,
          verified: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!verification) {
        throw new BadRequestException('O e-mail do administrador não foi verificado.');
      }
    }

    const subdomain = data.subdomain.toLowerCase().trim();
    this.validateSubdomainFormat(subdomain);
    
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

    const isUnlimited = data.saasPlan === 'UNLIMITED';
    const trialDays = 7;
    const trialEndsAt = data.trialEndsAt !== undefined 
      ? (data.trialEndsAt ? new Date(data.trialEndsAt) : null) 
      : new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        subdomain,
        customDomain: data.customDomain ? data.customDomain.toLowerCase().trim() : null,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || '#C5A880',
        secondaryColor: data.secondaryColor || '#18181b',
        backgroundColor: data.backgroundColor || '#FAF9FF',
        loginStyle: data.loginStyle || 'split',
        rootRedirect: data.rootRedirect || 'login',
        footerSlogan: data.footerSlogan || null,
        footerInstagram: data.footerInstagram || null,
        footerWhatsapp: data.footerWhatsapp || null,
        footerFacebook: data.footerFacebook || null,
        footerHours: data.footerHours || null,
        footerAddress: data.footerAddress || null,
        footerPhone: data.footerPhone || null,
        footerEmail: data.footerEmail || null,
        footerCopyright: data.footerCopyright || null,
        footerPoweredBy: data.footerPoweredBy || null,
        subscriptionModuleEnabled: data.subscriptionModuleEnabled !== undefined ? data.subscriptionModuleEnabled : (isUnlimited ? true : false),
        active: data.active !== false,
        saasPlan: data.saasPlan || 'BASIC',
        saasPlanLimitBarbers: data.saasPlanLimitBarbers !== undefined ? parseInt(data.saasPlanLimitBarbers, 10) : (isUnlimited ? 99999 : 3),
        saasPlanLimitAttendants: data.saasPlanLimitAttendants !== undefined ? parseInt(data.saasPlanLimitAttendants, 10) : (isUnlimited ? 99999 : 1),
        saasPlanLimitClients: data.saasPlanLimitClients !== undefined ? parseInt(data.saasPlanLimitClients, 10) : (isUnlimited ? 99999 : 500),
        whatsAppEnabled: data.whatsAppEnabled !== undefined ? data.whatsAppEnabled : true,
        chatbotIAEnabled: data.chatbotIAEnabled !== undefined ? data.chatbotIAEnabled : (isUnlimited ? true : false),
        chatbotPrompt: data.chatbotPrompt || null,
        trialEndsAt,
        subscriptionStatus: data.subscriptionStatus || 'TRIAL',
        asaasCustomerId: data.asaasCustomerId || null,
        asaasSubscriptionId: data.asaasSubscriptionId || null,
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
    if (data.backgroundColor !== undefined) updateData.backgroundColor = data.backgroundColor;
    if (data.loginStyle !== undefined) updateData.loginStyle = data.loginStyle;
    if (data.rootRedirect !== undefined) updateData.rootRedirect = data.rootRedirect;

    if (data.footerSlogan !== undefined) updateData.footerSlogan = data.footerSlogan;
    if (data.footerInstagram !== undefined) updateData.footerInstagram = data.footerInstagram;
    if (data.footerWhatsapp !== undefined) updateData.footerWhatsapp = data.footerWhatsapp;
    if (data.footerFacebook !== undefined) updateData.footerFacebook = data.footerFacebook;
    if (data.footerHours !== undefined) updateData.footerHours = data.footerHours;
    if (data.footerAddress !== undefined) updateData.footerAddress = data.footerAddress;
    if (data.footerPhone !== undefined) updateData.footerPhone = data.footerPhone;
    if (data.footerEmail !== undefined) updateData.footerEmail = data.footerEmail;
    if (data.footerCopyright !== undefined) updateData.footerCopyright = data.footerCopyright;
    if (data.footerPoweredBy !== undefined) updateData.footerPoweredBy = data.footerPoweredBy;
    if (data.subscriptionModuleEnabled !== undefined) updateData.subscriptionModuleEnabled = data.subscriptionModuleEnabled;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.gatewayProvider !== undefined) updateData.gatewayProvider = data.gatewayProvider;
    if (data.gatewayApiKey !== undefined) updateData.gatewayApiKey = data.gatewayApiKey;
    if (data.gatewayWebhookSecret !== undefined) updateData.gatewayWebhookSecret = data.gatewayWebhookSecret;
    if (data.saasPlan !== undefined) updateData.saasPlan = data.saasPlan;
    if (data.saasPlanLimitBarbers !== undefined) updateData.saasPlanLimitBarbers = parseInt(data.saasPlanLimitBarbers, 10);
    if (data.saasPlanLimitAttendants !== undefined) updateData.saasPlanLimitAttendants = parseInt(data.saasPlanLimitAttendants, 10);
    if (data.saasPlanLimitClients !== undefined) updateData.saasPlanLimitClients = parseInt(data.saasPlanLimitClients, 10);
    if (data.whatsAppEnabled !== undefined) updateData.whatsAppEnabled = data.whatsAppEnabled;
    if (data.chatbotIAEnabled !== undefined) updateData.chatbotIAEnabled = data.chatbotIAEnabled;
    if (data.chatbotPrompt !== undefined) updateData.chatbotPrompt = data.chatbotPrompt;
    if (data.trialEndsAt !== undefined) updateData.trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null;
    if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus;
    if (data.asaasCustomerId !== undefined) updateData.asaasCustomerId = data.asaasCustomerId;
    if (data.asaasSubscriptionId !== undefined) updateData.asaasSubscriptionId = data.asaasSubscriptionId;

    if (data.subdomain !== undefined) {
      const subdomain = data.subdomain.toLowerCase().trim();
      this.validateSubdomainFormat(subdomain);
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

    return this.prisma.$transaction(async (tx) => {
      // 1. AuditLogs
      await tx.auditLog.deleteMany({ where: { tenantId: id } });

      // 2. Goals
      await tx.goal.deleteMany({ where: { tenantId: id } });

      // 3. QuickReplies
      await tx.quickReply.deleteMany({ where: { tenantId: id } });

      // 4. Feedbacks (via Appointment)
      await tx.feedback.deleteMany({
        where: {
          appointment: {
            tenantId: id,
          },
        },
      });

      // 5. Appointments
      await tx.appointment.deleteMany({ where: { tenantId: id } });

      // 6. Messages (via Client)
      await tx.message.deleteMany({
        where: {
          client: {
            tenantId: id,
          },
        },
      });

      // 7. Subscriptions (via Client or Plan)
      await tx.subscription.deleteMany({
        where: {
          OR: [
            { client: { tenantId: id } },
            { plan: { tenantId: id } }
          ]
        }
      });

      // 8. Plans
      await tx.plan.deleteMany({ where: { tenantId: id } });

      // 9. Clients
      await tx.client.deleteMany({ where: { tenantId: id } });

      // 10. ProductCommissions (via Product or Barber/User)
      await tx.productCommission.deleteMany({
        where: {
          OR: [
            { product: { tenantId: id } },
            { barber: { user: { tenantId: id } } }
          ]
        }
      });

      // 11. Products
      await tx.product.deleteMany({ where: { tenantId: id } });

      // 12. ServiceCommissions (via Service or Barber/User)
      await tx.serviceCommission.deleteMany({
        where: {
          OR: [
            { service: { tenantId: id } },
            { barber: { user: { tenantId: id } } }
          ]
        }
      });

      // 13. Services
      await tx.service.deleteMany({ where: { tenantId: id } });

      // 14. WorkSchedules (via Barber)
      await tx.workSchedule.deleteMany({
        where: {
          barber: {
            user: {
              tenantId: id,
            },
          },
        },
      });

      // 15. AgendaBlocks (via Barber)
      await tx.agendaBlock.deleteMany({
        where: {
          barber: {
            user: {
              tenantId: id,
            },
          },
        },
      });

      // 16. Barbers (via User)
      await tx.barber.deleteMany({
        where: {
          user: {
            tenantId: id,
          },
        },
      });

      // 17. Users (all users belonging to this tenant, including admins)
      await tx.user.deleteMany({ where: { tenantId: id } });

      // 18. Finally, the Tenant
      return tx.tenant.delete({
        where: { id },
      });
    });
  }

  async handlePlatformAsaasWebhook(payload: any) {
    this.logger.log(`Recebido webhook do Asaas: ${JSON.stringify(payload)}`);
    const event = payload.event;
    const payment = payload.payment;
    if (!event || !payment) {
      throw new BadRequestException('Payload de webhook inválido');
    }

    const customerId = payment.customer;
    const subscriptionId = payment.subscription;

    let tenant = null;

    if (subscriptionId) {
      tenant = await this.prisma.tenant.findFirst({
        where: { asaasSubscriptionId: subscriptionId }
      });
    }

    if (!tenant && customerId) {
      tenant = await this.prisma.tenant.findFirst({
        where: { asaasCustomerId: customerId }
      });
    }

    if (!tenant) {
      let email = payment.customerEmail || payment.email || payload.email;
      if (!email && customerId) {
        const apiKey = await this.settingsService.getSetting('PLATFORM_ASAAS_API_KEY');
        if (apiKey) {
          try {
            const baseUrl = apiKey.startsWith('$ak_prod_') ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/v3';
            const res = await fetch(`${baseUrl}/customers/${customerId}`, {
              headers: {
                'access_token': apiKey
              }
            });
            if (res.ok) {
              const custData = (await res.json()) as any;
              email = custData.email;
            }
          } catch (err: any) {
            this.logger.error(`Erro ao buscar e-mail do cliente no Asaas: ${err.message}`);
          }
        }
      }

      if (email) {
        const cleanEmail = email.toLowerCase().trim();
        const user = await this.prisma.user.findFirst({
          where: {
            email: {
              equals: cleanEmail,
              mode: 'insensitive'
            },
            role: 'ADMIN'
          },
          include: { tenant: true }
        });
        if (user && user.tenant) {
          tenant = user.tenant;
        }
      }
    }

    if (!tenant) {
      this.logger.warn(`Estabelecimento correspondente não encontrado para o webhook (cliente: ${customerId})`);
      return { status: 'ignored', reason: 'Tenant not found' };
    }

    const statusMap: Record<string, string> = {
      PAYMENT_CONFIRMED: 'ACTIVE',
      PAYMENT_RECEIVED: 'ACTIVE',
      PAYMENT_OVERDUE: 'OVERDUE',
      SUBSCRIPTION_DELETED: 'CANCELED',
      SUBSCRIPTION_CANCELLED: 'CANCELED'
    };

    const newStatus = statusMap[event];
    if (newStatus) {
      const updateData: any = {
        subscriptionStatus: newStatus,
        asaasCustomerId: customerId || tenant.asaasCustomerId,
      };

      if (subscriptionId) {
        updateData.asaasSubscriptionId = subscriptionId;
      }

      if (newStatus === 'ACTIVE') {
        updateData.trialEndsAt = null;
        updateData.active = true;
      }

      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: updateData
      });

      this.logger.log(`Tenant ${tenant.name} (${tenant.id}) atualizado para status: ${newStatus}`);
      return { status: 'success', tenantId: tenant.id, newStatus };
    }

    return { status: 'ignored', reason: 'Unhandled event type' };
  }

  async getSettingHelper(key: string): Promise<string> {
    return this.settingsService.getSetting(key);
  }

  async setupTenantForUser(userId: string, data: any) {
    if (!data.name || !data.subdomain) {
      throw new BadRequestException('Nome e subdomínio são obrigatórios');
    }

    const subdomain = data.subdomain.toLowerCase().trim();
    this.validateSubdomainFormat(subdomain);

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

    const trialDays = 7;
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        subdomain,
        customDomain: data.customDomain ? data.customDomain.toLowerCase().trim() : null,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || '#C5A880',
        secondaryColor: data.secondaryColor || '#18181b',
        backgroundColor: data.backgroundColor || '#FAF9FF',
        loginStyle: data.loginStyle || 'split',
        rootRedirect: data.rootRedirect || 'login',
        footerSlogan: data.footerSlogan || null,
        footerInstagram: data.footerInstagram || null,
        footerWhatsapp: data.footerWhatsapp || null,
        footerFacebook: data.footerFacebook || null,
        footerHours: data.footerHours || null,
        footerAddress: data.footerAddress || null,
        footerPhone: data.footerPhone || null,
        footerEmail: data.footerEmail || null,
        footerCopyright: data.footerCopyright || null,
        footerPoweredBy: data.footerPoweredBy || null,
        subscriptionModuleEnabled: false,
        active: true,
        saasPlan: data.saasPlan || 'BASIC',
        saasPlanLimitBarbers: data.saasPlan === 'UNLIMITED' ? 99999 : 3,
        saasPlanLimitAttendants: data.saasPlan === 'UNLIMITED' ? 99999 : 1,
        saasPlanLimitClients: data.saasPlan === 'UNLIMITED' ? 99999 : 500,
        whatsAppEnabled: true,
        chatbotIAEnabled: data.saasPlan === 'UNLIMITED',
        trialEndsAt,
        subscriptionStatus: 'TRIAL',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { tenantId: tenant.id }
    });

    return tenant;
  }
}
