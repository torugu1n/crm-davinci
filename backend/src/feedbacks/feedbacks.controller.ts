import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenantId } from '../auth/tenant.decorator';

@Controller('feedbacks')
export class FeedbacksController {
  constructor(private feedbacksService: FeedbacksService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT', 'SUPER_ADMIN')
  async findAll(@ActiveTenantId() tenantId: string) {
    return this.feedbacksService.findAll(tenantId);
  }

  @Post()
  async create(@Body() body: any, @ActiveTenantId() tenantId: string) {
    return this.feedbacksService.create(body, tenantId);
  }
}
