import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'Reset password token (deprecated in body, use query param token)',
    example: 'abc-123-token',
    required: false,
  })
  @IsString()
  token?: string;

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
