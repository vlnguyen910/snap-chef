import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { LoginDto } from './login.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignUpDto extends LoginDto {
  @ApiProperty({
    description: 'Username for the new account',
    example: 'johndoe',
  })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiPropertyOptional({
    description: 'Avatar URL for the user',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatar_url?: string;
}
