import { IsBoolean } from 'class-validator';

export class UserStatusUpdateDto {
  @IsBoolean()
  status!: boolean;
}
