import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('summary')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getSummary(@ActiveTenantId() tenantId: string) {
    return this.financeService.getFinanceSummary(tenantId);
  }

  @Get('goals')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getGoals(@ActiveTenantId() tenantId: string) {
    return this.financeService.getGoals(tenantId);
  }

  @Post('goals')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createGoal(@Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.financeService.createGoal(body, tenantId);
  }

  @Put('goals/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateGoal(@Param('id') id: string, @Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.financeService.updateGoal(id, body, tenantId);
  }

  @Delete('goals/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteGoal(@Param('id') id: string, @ActiveTenantId() tenantId: string) {
    return this.financeService.deleteGoal(id, tenantId);
  }

  @Get('audit-logs')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAuditLogs(@ActiveTenantId() tenantId: string) {
    return this.financeService.getAuditLogs(tenantId);
  }
}
