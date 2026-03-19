import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordTokenDto {
  @ApiProperty({
    description: 'Reset password token received from email query param',
    example: 'abc-123-token',
  })
  @IsNotEmpty()
  @IsString()
  token!: string;
}
