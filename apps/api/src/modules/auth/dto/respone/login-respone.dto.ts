import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiPropertyOptional({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1Ni...',
  })
  access_token?: string;

  @ApiPropertyOptional({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1Ni...',
  })
  refresh_token?: string;
}
