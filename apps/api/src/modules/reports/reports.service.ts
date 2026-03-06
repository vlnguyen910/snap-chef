import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import { NotificationMessages, ErrorMessages } from 'src/common/constants';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly userService: UsersService,
  ) {}

  async create(reporter_id: string, dto: CreateReportDto) {
    const user = await this.userService.findOne(reporter_id);
    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

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

    const results = await Promise.allSettled(
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

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `Failed to create notification for admin ${admins[index]?.id} regarding report ${report.id} from user ${reporter_id}`,
          result.reason,
        );
      }
    });

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
    if (!report) throw new NotFoundException(ErrorMessages.REPORT_NOT_FOUND);

    if (payload.handler_id) {
      const user = await this.userService.findOne(payload.handler_id);
      if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
      if (user.role !== UserRoles.ADMIN)
        throw new ForbiddenException(ErrorMessages.INSUFFICIENT_AUTHORITY);
    }

    return await this.prisma.report.update({
      where: { id },
      data: { ...payload },
    });
  }
}
