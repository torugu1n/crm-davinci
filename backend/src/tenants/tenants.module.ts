import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { SystemSettingsModule } from '../settings/system-settings.module';
import { SupabaseService } from '../supabase.service';

@Module({
  imports: [SystemSettingsModule],
  controllers: [TenantsController],
  providers: [TenantsService, SupabaseService],
  exports: [TenantsService],
})
export class TenantsModule {}
