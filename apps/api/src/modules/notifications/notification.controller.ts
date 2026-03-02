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

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(@GetUser() user: TokenPayload) {
    return this.notificationService.getNotifications(user.sub);
  }

  @Patch(':id/read')
  async markAsRead(
    @GetUser() user: TokenPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(user.sub, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@GetUser() user: TokenPayload) {
    await this.notificationService.markAllAsRead(user.sub);
  }
}
