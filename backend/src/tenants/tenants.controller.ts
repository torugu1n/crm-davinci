import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { SuperAdminJwtAuthGuard } from '../auth/superadmin-jwt-auth.guard';
import { TenantOrSuperAdminAuthGuard } from '../auth/tenant-or-superadmin-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { SupabaseService } from '../supabase.service';

@Controller('tenants')
export class TenantsController {
  constructor(
    private tenantsService: TenantsService,
    private supabaseService: SupabaseService,
  ) {}

  @Post('upload-logo')
  @UseGuards(TenantOrSuperAdminAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i) || !allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Apenas imagens jpg, jpeg, png, gif ou webp são permitidas.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const fileName = `logo-${uniqueSuffix}${ext}`;
    
    try {
      const publicUrl = await this.supabaseService.uploadFile('logos', fileName, file.buffer, file.mimetype);
      return {
        url: publicUrl,
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao enviar arquivo para o Supabase: ${error.message}`);
    }
  }

  @Get('public/billing/links')
  async getBillingLinks() {
    const basicLink = await this.tenantsService.getSettingHelper('PLAN_BASIC_LINK');
    const unlimitedLink = await this.tenantsService.getSettingHelper('PLAN_UNLIMITED_LINK');
    return {
      PLAN_BASIC_LINK: basicLink,
      PLAN_UNLIMITED_LINK: unlimitedLink,
    };
  }

  @Get('public/:subdomain')
  async findPublicBySubdomain(@Param('subdomain') subdomain: string) {
    return this.tenantsService.findBySubdomain(subdomain);
  }

  @Get()
  @UseGuards(SuperAdminJwtAuthGuard)
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @UseGuards(SuperAdminJwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post('onboarding')
  async onboarding(@Body() body: any) {
    return this.tenantsService.create({ ...body, requireEmailVerification: true });
  }

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  async setup(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    return this.tenantsService.setupTenantForUser(userId, body);
  }

  @Post()
  @UseGuards(SuperAdminJwtAuthGuard)
  async create(@Body() body: any) {
    return this.tenantsService.create(body);
  }

  @Put(':id')
  @UseGuards(TenantOrSuperAdminAuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const user = req.user;
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user.roles && user.roles.includes('SUPER_ADMIN'));
    
    if (!isSuperAdmin) {
      if (user.tenantId !== id) {
        throw new BadRequestException('Você não tem permissão para alterar as configurações deste estabelecimento.');
      }
      // Bloquear alteração de campos de infraestrutura ou administração global por ADMIN local
      delete body.subdomain;
      delete body.customDomain;
      delete body.adminEmail;
      delete body.adminPassword;
      delete body.adminName;
      delete body.subscriptionModuleEnabled;
      delete body.saasPlan;
      delete body.saasPlanLimitBarbers;
      delete body.saasPlanLimitAttendants;
      delete body.saasPlanLimitClients;
      delete body.whatsAppEnabled;
      delete body.chatbotIAEnabled;
    }
    return this.tenantsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(SuperAdminJwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.tenantsService.delete(id);
  }

  @Post('saas-webhook')
  async handleAsaasWebhook(@Body() body: any) {
    return this.tenantsService.handlePlatformAsaasWebhook(body);
  }
}
