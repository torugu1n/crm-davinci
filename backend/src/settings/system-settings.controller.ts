import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { SuperAdminJwtAuthGuard } from '../auth/superadmin-jwt-auth.guard';

@Controller('system-settings')
@UseGuards(SuperAdminJwtAuthGuard)
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getAllSettings();
  }

  @Post()
  async updateSettings(@Body() body: Record<string, string>) {
    await this.settingsService.updateSettings(body);
    return { success: true };
  }
}
