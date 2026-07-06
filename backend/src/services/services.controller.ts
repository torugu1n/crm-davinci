import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  async findAll(@ActiveTenantId() tenantId: string) {
    return this.servicesService.findAll(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async create(@Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.servicesService.create(body, req.user, tenantId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.servicesService.update(id, body, req.user, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async delete(@Param('id') id: string, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.servicesService.delete(id, req.user, tenantId);
  }
}
