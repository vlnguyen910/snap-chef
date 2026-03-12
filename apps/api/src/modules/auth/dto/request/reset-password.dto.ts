import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset password token received from email',
    example: 'abc-123-token',
  })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'New password for the user (min 8 characters)',
    example: 'newpassword123',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;
}
