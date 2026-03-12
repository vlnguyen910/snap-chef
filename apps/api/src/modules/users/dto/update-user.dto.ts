import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Update username',
    example: 'newusername',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Update avatar URL',
    example: 'https://example.com/new-avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @ApiPropertyOptional({
    description: 'Update verification status (Admin only)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({
    description: 'Update password (min 8 characters)',
    example: 'newpassword123',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
