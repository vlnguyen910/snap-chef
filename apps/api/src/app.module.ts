import { Module } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
