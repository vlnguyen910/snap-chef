import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GetUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { TokenPayload } from 'src/common/interfaces';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get notifications',
    description:
      'Retrieve all notifications for the current authenticated user.',
  })
  async getNotifications(@GetUser() user: TokenPayload) {
    return this.notificationService.getNotifications(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read by its ID.',
  })
  async markAsRead(
    @GetUser() user: TokenPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(user.sub, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark all as read',
    description:
      'Mark all existing notifications as read for the current user.',
  })
  async markAllAsRead(@GetUser() user: TokenPayload) {
    await this.notificationService.markAllAsRead(user.sub);
  }
}
