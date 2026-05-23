import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BarbersService } from './barbers.service';
import { BarbersController } from './barbers.controller';

@Module({
  controllers: [BarbersController],
  providers: [BarbersService, PrismaService],
  exports: [BarbersService],
})
export class BarbersModule {}
