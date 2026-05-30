import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('financial')
  async getFinancialReport(
    @ActiveTenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getFinancialReport(tenantId, startDate, endDate);
  }

  @Get('appointments')
  async getAppointmentsReport(
    @ActiveTenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getAppointmentsReport(tenantId, startDate, endDate);
  }

  @Get('clients')
  async getClientsReport(
    @ActiveTenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getClientsReport(tenantId, startDate, endDate);
  }
}
