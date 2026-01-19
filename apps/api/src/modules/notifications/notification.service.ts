import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/common/db/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { WebSocketEvents } from 'src/common/constants';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createNotification(dto: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          receiver_id: dto.receiverId,
          sender_id: dto.senderId,
          type: dto.type,
          message: dto.message,
          resource_id: dto.resourceId,
          resource_type: dto.resourceType,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
        },
      });

      // Send real-time notification
      this.notificationGateway.sendToUser(
        dto.receiverId,
        WebSocketEvents.NEW_NOTIFICATION,
        notification,
      );

      return notification;
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      throw error;
    }
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        receiver_id: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async markAsRead(userId: string, notificationId: number) {
    return this.prisma.notification.update({
      where: {
        id: notificationId,
        receiver_id: userId,
      },
      data: {
        is_read: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        receiver_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanUpOldNotifications() {
    this.logger.log('Cleaning up notifications older than 30 days...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await this.prisma.notification.deleteMany({
      where: {
        created_at: {
          lte: thirtyDaysAgo,
        },
      },
    });
    this.logger.log(`Deleted ${result.count} old notifications`);
  }
}
