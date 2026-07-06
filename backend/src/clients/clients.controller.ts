import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP', 'SUPER_ADMIN')
  async findAll(@ActiveTenantId() tenantId: string) {
    return this.clientsService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any, @ActiveTenantId() tenantId: string) {
    const isClient = req.user.role === 'CLIENT';
    if (isClient && req.user.id !== id) {
      throw new ForbiddenException('Você não tem permissão para visualizar os dados de outro cliente.');
    }
    return this.clientsService.findOne(id, tenantId);
  }

  @Post()
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP', 'SUPER_ADMIN')
  async create(@Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.clientsService.create(body, tenantId, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    const isClient = req.user.role === 'CLIENT';
    if (isClient && req.user.id !== id) {
      throw new ForbiddenException('Você não tem permissão para atualizar os dados de outro cliente.');
    }
    return this.clientsService.update(id, body, tenantId, req.user);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN', 'CLIENT')
  async delete(@Param('id') id: string, @Request() req: any, @ActiveTenantId() tenantId: string) {
    const isClient = req.user.role === 'CLIENT';
    if (isClient && req.user.id !== id) {
      throw new ForbiddenException('Você não tem permissão para deletar a conta de outro cliente.');
    }
    return this.clientsService.delete(id, tenantId, req.user);
  }
}
