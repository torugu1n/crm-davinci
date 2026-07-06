import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { BarbersService } from './barbers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('barbers')
export class BarbersController {
  constructor(private barbersService: BarbersService) {}

  @Get()
  async findAll(@ActiveTenantId() tenantId: string) {
    return this.barbersService.findAll(tenantId);
  }

  @Get('blocks/all')
  async getAllBlocks(@ActiveTenantId() tenantId: string) {
    return this.barbersService.getAllBlocks(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.barbersService.findOne(id, tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.barbersService.create(body, tenantId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.barbersService.update(id, body, tenantId);
  }

  @Put(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP', 'SUPER_ADMIN')
  async updateProfile(
    @Param('id') id: string,
    @Body() body: { miniBio?: string; fotoUrl?: string; especialidade?: string },
    @Request() req: any,
    @ActiveTenantId() tenantId: string
  ) {
    const user = req.user;
    const isAdminOrSuper = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.roles?.includes('ADMIN') || user.roles?.includes('SUPER_ADMIN');
    if (!isAdminOrSuper) {
      const barber = await this.barbersService.findOne(id, tenantId);
      if (barber.userId !== user.id) {
        throw new ForbiddenException('Você não tem permissão para alterar o perfil de outro profissional.');
      }
    }
    return this.barbersService.updateProfile(id, body, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async delete(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.barbersService.delete(id, tenantId);
  }

  @Get(':id/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP', 'SUPER_ADMIN')
  async getDashboard(@Param('id') id: string, @Request() req: any, @ActiveTenantId() tenantId: string) {
    this.ensureOwnProfessionalOrAdmin(id, req.user);
    return this.barbersService.getBarberDashboard(id, tenantId);
  }

  @Get(':id/schedule')
  async getSchedule(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.barbersService.getSchedule(id, tenantId);
  }

  @Put(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP', 'SUPER_ADMIN')
  async updateSchedule(@Param('id') id: string, @Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    this.ensureOwnProfessionalOrAdmin(id, req.user);
    return this.barbersService.updateSchedule(id, body, tenantId);
  }

  @Get(':id/blocks')
  async getBlocks(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.barbersService.getBlocks(id, tenantId);
  }

  @Post(':id/blocks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP', 'SUPER_ADMIN')
  async createBlock(
    @Param('id') id: string,
    @Body() body: { titulo: string; dataInicio: string; dataFim: string },
    @Request() req: any,
    @ActiveTenantId() tenantId: string
  ) {
    this.ensureOwnProfessionalOrAdmin(id, req.user);
    return this.barbersService.createBlock(id, body, tenantId);
  }

  @Delete('blocks/:blockId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP', 'SUPER_ADMIN')
  async deleteBlock(@Param('blockId') blockId: string, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.barbersService.deleteBlock(blockId, tenantId, req.user);
  }

  private ensureOwnProfessionalOrAdmin(barberId: string, user: any) {
    const isAdminOrSuper = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.roles?.includes('ADMIN') || user.roles?.includes('SUPER_ADMIN');
    if (!isAdminOrSuper && user.barberId !== barberId) {
      throw new ForbiddenException('Você não tem permissão para acessar dados de outro profissional.');
    }
  }
}
