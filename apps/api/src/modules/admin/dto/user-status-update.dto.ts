import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserStatusUpdateDto {
  @ApiProperty({
    description: 'New status of the user (active/inactive)',
    example: true,
  })
  @IsBoolean()
  status!: boolean;
}

