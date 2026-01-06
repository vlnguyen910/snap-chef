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
import { AuthProvider, UserRoles } from 'src/generated/prisma/enums';
import { Exclude, Expose } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string | null;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @IsNotEmpty()
  @IsEnum(UserRoles)
  role!: UserRoles;

  @IsNotEmpty()
  @IsEnum(AuthProvider)
  provider!: AuthProvider;

  @IsOptional()
  @IsString()
  provider_id?: string;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;
}

export class UserResponseDto {
  @Expose()
  username!: string;

  @Expose()
  email!: string;

  @Expose()
  role!: UserRoles;

  @Exclude()
  password!: string;

  @Expose()
  createdAt!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
