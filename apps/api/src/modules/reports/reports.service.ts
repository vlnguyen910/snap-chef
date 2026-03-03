import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { PrismaService } from 'src/common/db/prisma.service';
import {
  NotificationResourceType,
  NotificationType,
  Report,
  UserRoles,
} from 'src/generated/prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { NotificationMessages } from 'src/common/constants';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly userService: UsersService,
  ) {}

  async create(reporter_id: string, dto: CreateReportDto) {
    const user = await this.userService.findOne(reporter_id);
    if (!user) throw new NotFoundException('User is not found or exist');

    const report = await this.prisma.report.create({
      data: {
        reporter_id,
        ...dto,
      },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: UserRoles.ADMIN },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          senderId: reporter_id,
          receiverId: admin.id,
          type: NotificationType.REPORT,
          message: NotificationMessages.NEW_REPORT,
          resourceType: NotificationResourceType.REPORT,
          resourceId: report.id,
        }),
      ),
    );

    return report;
  }

  async findAll() {
    return await this.prisma.report.findMany();
  }

  async findOne(id: string): Promise<Report | null> {
    return await this.prisma.report.findUnique({
      where: { id },
    });
  }

  async update(id: string, payload: UpdateReportDto) {
    const report = await this.findOne(id);
    if (!report) throw new NotFoundException('Report is not found or exist');

    return await this.prisma.report.update({
      where: { id },
      data: { ...payload },
    });
  }
}
