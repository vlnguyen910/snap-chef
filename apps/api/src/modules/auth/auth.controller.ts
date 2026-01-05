import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { LoginResponseDto } from './dto/respone/login-respone.dto';
import { SignUpDto } from './dto/request/sign-up.dto';
import { VerifyEmailDto } from './dto/request/verify-email.dto';
import type { Response } from 'express';
import { GetUser } from 'src/common/decorators/user.decorator';
import { TokenPayload } from 'src/common/interfaces/auth.interface';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { RefreshTokenResponseDto } from './dto/respone/refresh-token-respone.dto';
import { cookieConfiguration } from 'src/common/config/cookie.config';
import type { ConfigType } from '@nestjs/config';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(cookieConfiguration.KEY)
    private readonly cookieConfig: ConfigType<typeof cookieConfiguration>,
  ) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const data = await this.authService.login(body);

    res.cookie('access_token', data.access_token, {
      httpOnly: this.cookieConfig.httpOnly,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      maxAge: this.cookieConfig.accessTokenMaxAge,
    });

    res.cookie('refresh_token', data.refresh_token, {
      httpOnly: this.cookieConfig.httpOnly,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      maxAge: this.cookieConfig.refreshTokenMaxAge,
      path: '/auth/refresh'
    });

    return data;
  }

  @Post('sign-up')
  async signUp(@Body() body: SignUpDto) {
    return this.authService.signUp(body);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @GetUser() userPayload: TokenPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshTokenResponseDto> {
    const data = await this.authService.refreshToken(userPayload);

    res.cookie('access_token', data.access_token, {
      httpOnly: this.cookieConfig.httpOnly,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      maxAge: this.cookieConfig.accessTokenMaxAge,
    });

    return data;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @GetUser() user: TokenPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    res.clearCookie('access_token', {
      httpOnly: this.cookieConfig.httpOnly,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
    });

    res.clearCookie('refresh_token', {
      httpOnly: this.cookieConfig.httpOnly,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      path: '/auth/refresh',
    });

    await this.authService.logout(user.jti);

    return { message: 'Logged out successfully' };
  }

  @Get("verify-email")
  async verifyUser(
    @Query() payload: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return await this.authService.verifyEmail(payload);
  }
}
