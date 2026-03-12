import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { UserRoles } from 'src/generated/prisma/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username for the user',
    example: 'johndoe',
  })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'johndoe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password of the user (min 8 characters)',
    example: 'password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string | null;

  @ApiPropertyOptional({
    description: 'Avatar URL for the user',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @ApiProperty({
    description: 'Role assigned to the user',
    enum: UserRoles,
    example: UserRoles.USER,
  })
  @IsNotEmpty()
  @IsEnum(UserRoles)
  role!: UserRoles;

  @ApiPropertyOptional({
    description: 'Verification status of the user',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'johndoe',
  })
  @Expose()
  username!: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'johndoe@example.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRoles,
    example: UserRoles.USER,
  })
  @Expose()
  role!: UserRoles;

  @Exclude()
  password!: string;

  @ApiProperty({
    description: 'Date when the user was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
