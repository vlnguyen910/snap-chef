import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { LoginResponseDto } from './dto/respone/login-respone.dto';
import { SignUpDto } from './dto/request/sign-up.dto';
import { VerifyEmailDto } from './dto/request/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(body);
  }

  @Post('sign-up')
  async signUp(@Body() body: SignUpDto) {
    return this.authService.signUp(body);
  }

  @Get("verify-email")
  async verifyUser(
    @Query() payload: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return await this.authService.verifyEmail(id, token);
  }
}
