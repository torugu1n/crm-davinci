import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, PrismaService],
  exports: [ServicesService],
})
export class ServicesModule {}
