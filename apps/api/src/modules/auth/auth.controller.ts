import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { LoginResponseDto } from './dto/respone/login-respone.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(body);
  }
}
