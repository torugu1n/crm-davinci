import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ClientsModule } from './clients/clients.module';
import { BarbersModule } from './barbers/barbers.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { FinanceModule } from './finance/finance.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PrismaModule } from './prisma.module';
import { TenantMiddleware } from './auth/tenant.middleware';
import { TenantsModule } from './tenants/tenants.module';
import { ReportsModule } from './reports/reports.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TenantSubscriptionGuard } from './auth/tenant-subscription.guard';
import { SystemSettingsModule } from './settings/system-settings.module';

@Module({
  imports: [
    PrismaModule,
    WebsocketModule,
    AuthModule,
    AppointmentsModule,
    ClientsModule,
    BarbersModule,
    ServicesModule,
    ProductsModule,
    UsersModule,
    FeedbacksModule,
    FinanceModule,
    WhatsappModule,
    TenantsModule,
    ReportsModule,
    PlansModule,
    SubscriptionsModule,
    SystemSettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantSubscriptionGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
