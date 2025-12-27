import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { LoginDto } from './login.dto';

export class SignUpDto extends LoginDto {
  @IsNotEmpty()
  @IsString()
  username!: string;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;
}
