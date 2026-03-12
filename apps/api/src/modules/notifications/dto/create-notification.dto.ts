import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  NotificationResourceType,
  NotificationType,
} from 'src/generated/prisma/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID of the user who will receive the notification',
    example: 'user-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  receiverId!: string;

  @ApiPropertyOptional({
    description: 'ID of the user who triggered the notification',
    example: 'user-uuid-456',
  })
  @IsString()
  @IsOptional()
  senderId?: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.LIKE,
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({
    description: 'Notification message content',
    example: 'John Doe liked your recipe!',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    description: 'ID of the resource related to the notification (e.g., recipe ID)',
    example: 'recipe-uuid-789',
  })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'Type of the resource related to the notification',
    enum: NotificationResourceType,
    example: NotificationResourceType.RECIPE,
  })
  @IsEnum(NotificationResourceType)
  @IsOptional()
  resourceType?: NotificationResourceType;
}
