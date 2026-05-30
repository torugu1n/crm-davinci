import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post('upload-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `logo-${uniqueSuffix}${ext}`);
        },
      }),
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
    return {
      url: `/uploads/logos/${file.filename}`,
    };
  }

  @Get('public/:subdomain')
  async findPublicBySubdomain(@Param('subdomain') subdomain: string) {
    return this.tenantsService.findBySubdomain(subdomain);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async create(@Body() body: any) {
    return this.tenantsService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
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
    }
    return this.tenantsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async delete(@Param('id') id: string) {
    return this.tenantsService.delete(id);
  }
}
