import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { join } from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Load .env from root directory only in development, but don't override existing env vars
    if (process.env.NODE_ENV !== 'production') {
      config({ path: join(__dirname, '../../../.env'), override: false });
    }
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not found in environment variables');
      throw new Error('DATABASE_URL environment variable is required');
    }
    
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
