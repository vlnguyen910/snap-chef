import { ApiProperty } from '@nestjs/swagger';

export class SignUpResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1Ni...',
  })
  access_token!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1Ni...',
  })
  refresh_token!: string;
}
