import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from 'src/common/db/prisma.module';
import { NotificationModule } from '../notifications/notification.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, NotificationModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
