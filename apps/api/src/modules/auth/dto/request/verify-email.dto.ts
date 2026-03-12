import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Verification token received from email',
    example: 'verify-token-123',
  })
  @IsNotEmpty()
  @IsString()
  token!: string;
}
