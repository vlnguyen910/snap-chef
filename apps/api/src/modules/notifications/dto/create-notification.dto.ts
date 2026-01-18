import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationResourceType, NotificationType } from 'src/generated/prisma/enums';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  receiverId!: string;

  @IsString()
  @IsOptional()
  senderId?: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsOptional()
  resourceId?: string;

  @IsEnum(NotificationResourceType)
  @IsOptional()
  resourceType?: NotificationResourceType;
}
