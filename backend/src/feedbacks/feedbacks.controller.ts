import { Controller, Get, Post, Body } from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';

@Controller('feedbacks')
export class FeedbacksController {
  constructor(private feedbacksService: FeedbacksService) {}

  @Get()
  async findAll() {
    return this.feedbacksService.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.feedbacksService.create(body);
  }
}
