import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ClientsModule } from './clients/clients.module';
import { BarbersModule } from './barbers/barbers.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { FinanceModule } from './finance/finance.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    WebsocketModule,
    AuthModule,
    AppointmentsModule,
    ClientsModule,
    BarbersModule,
    ServicesModule,
    ProductsModule,
    FeedbacksModule,
    FinanceModule,
    WhatsappModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
