import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('feedbacks')
export class FeedbacksController {
  constructor(private feedbacksService: FeedbacksService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ATTENDANT')
  async findAll() {
    return this.feedbacksService.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.feedbacksService.create(body);
  }
}
