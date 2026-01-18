import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';
import { PrismaModule } from 'src/common/db/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule, 
    ConfigModule,
    // JwtModule is likely global, but importing doesn't hurt if we need specific config, 
    // though usually global module is enough. 
    // If it's global, we don't strictly need it here, but explicit is fine.
    // However, if we assume global, we can omit it. I'll omit it to avoid "Multiple providers" if it re-registers.
    // But Gateway uses JwtService. If JwtModule is global, JwtService is available.
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
