import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { UserRoles } from 'src/generated/prisma/enums';
import { Exclude, Expose } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @IsNotEmpty()
  @IsEnum(UserRoles)
  role!: UserRoles;
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
