import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('summary')
  @Roles('ADMIN')
  async getSummary() {
    return this.financeService.getFinanceSummary();
  }

  @Get('goals')
  @Roles('ADMIN')
  async getGoals() {
    return this.financeService.getGoals();
  }

  @Post('goals')
  @Roles('ADMIN')
  async createGoal(@Body() body: any) {
    return this.financeService.createGoal(body);
  }

  @Put('goals/:id')
  @Roles('ADMIN')
  async updateGoal(@Param('id') id: string, @Body() body: any) {
    return this.financeService.updateGoal(id, body);
  }

  @Delete('goals/:id')
  @Roles('ADMIN')
  async deleteGoal(@Param('id') id: string) {
    return this.financeService.deleteGoal(id);
  }

  @Get('audit-logs')
  @Roles('ADMIN')
  async getAuditLogs() {
    return this.financeService.getAuditLogs();
  }
}
