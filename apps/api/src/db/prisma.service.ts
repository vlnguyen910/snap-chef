import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  private readonly logger = new Logger(PrismaService.name, { timestamp: true });
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected with database');
    } catch(error) {
      this.logger.error('Database connection failled: ' + error);
      throw error;
      
    }
  }
}
