import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/db/prisma.module';
import { CommentsService } from './comments.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
