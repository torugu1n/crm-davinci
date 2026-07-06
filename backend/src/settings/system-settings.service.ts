import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SystemSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSetting(key: string): Promise<string> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    if (setting) return setting.value;
    return process.env[key] || '';
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const dbSettings = await this.prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const setting of dbSettings) {
      settingsMap[setting.key] = setting.value;
    }
    
    const expectedKeys = [
      'PLATFORM_ASAAS_API_KEY',
      'PLAN_BASIC_LINK',
      'PLAN_UNLIMITED_LINK',
      'RESEND_API_KEY',
      'RESEND_FROM_EMAIL'
    ];
    for (const key of expectedKeys) {
      if (!(key in settingsMap)) {
        settingsMap[key] = process.env[key] || '';
      }
    }

    return settingsMap;
  }

  async updateSettings(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.setSetting(key, value);
    }
  }
}
