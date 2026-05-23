import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, PrismaService],
  exports: [FinanceService],
})
export class FinanceModule {}
