import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
      super();
      return;
    }

    const url = new URL(databaseUrl);
    url.searchParams.set('connection_limit', process.env.DATABASE_CONNECTION_LIMIT || '3');
    url.searchParams.set('pool_timeout', process.env.DATABASE_POOL_TIMEOUT || '10');

    super({
      datasources: {
        db: { url: url.toString() },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
