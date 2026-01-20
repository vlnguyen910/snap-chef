import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { LoginResponseDto } from './dto/respone/login-respone.dto';
import { SignUpDto } from './dto/request/sign-up.dto';
import { VerifyEmailDto } from './dto/request/verify-email.dto';
import type { Response } from 'express';
import { GetUser } from 'src/common/decorators';
import { TokenPayload } from 'src/common/interfaces';
import {
  RefreshTokenGuard,
  JwtAuthGuard,
  GoogleOAuthGuard,
} from 'src/common/guards';
import { RefreshTokenResponseDto } from './dto/respone/refresh-token-respone.dto';
import { cookieConfiguration } from 'src/config';
import type { ConfigType } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(cookieConfiguration.KEY)
    private readonly cookieConfig: ConfigType<typeof cookieConfiguration>,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const data = await this.authService.login(body);

    res.cookie('refresh_token', data.refresh_token, {
      httpOnly: this.cookieConfig.httpOnly,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      maxAge: this.cookieConfig.refreshTokenMaxAge,
      path: '/auth/refresh',
    });

    const { refresh_token, ...rest } = data;
    return rest;
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

    return data;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @GetUser() user: TokenPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {

    res.clearCookie('refresh_token', {
      httpOnly: this.cookieConfig.httpOnly,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      path: '/auth/refresh',
    });

    await this.authService.logout(user.jti);

    return { message: 'Logged out successfully' };
  }

  @Get('verify-email')
  async verifyUser(
    @Query() payload: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return await this.authService.verifyEmail(payload);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {}

  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const data = await this.authService.googleLogin(req);


    res.cookie('refresh_token', data.refresh_token, {
      httpOnly: this.cookieConfig.httpOnly,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      maxAge: this.cookieConfig.refreshTokenMaxAge,
      path: '/auth/refresh',
    });

    const { refresh_token, ...rest } = data;
    return rest;
  }
  }
}
