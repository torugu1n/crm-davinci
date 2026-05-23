import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FeedbacksService } from './feedbacks.service';
import { FeedbacksController } from './feedbacks.controller';

@Module({
  controllers: [FeedbacksController],
  providers: [FeedbacksService, PrismaService],
  exports: [FeedbacksService],
})
export class FeedbacksModule {}
