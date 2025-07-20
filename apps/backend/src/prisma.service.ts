import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { join } from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Load .env from root directory
    config({ path: join(__dirname, '../../../.env') });
    
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  enableShutdownHooks() {
    this.$on('beforeExit' as Parameters<PrismaClient['$on']>[0], async () => {
      await this.$disconnect();
    });
  }
}
