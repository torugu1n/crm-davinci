import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(@Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.appointmentsService.findAll(req.user, tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.appointmentsService.findOne(id, req.user, tenantId);
  }

  @Post()
  async create(@Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.appointmentsService.create(body, req.user, tenantId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.appointmentsService.update(id, body, req.user, tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ATTENDANT', 'BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE', 'ESTHETICIAN', 'MAKEUP', 'SUPER_ADMIN')
  async delete(@Param('id') id: string, @Request() req: any, @ActiveTenantId() tenantId: string) {
    return this.appointmentsService.delete(id, req.user, tenantId);
  }
}
