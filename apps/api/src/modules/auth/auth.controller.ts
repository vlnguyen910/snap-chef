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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
import { ForgetPasswordDto } from './dto/request/forget-password.dto';
import { ResetPasswordDto } from './dto/request/reset-password.dto';
import { RefreshTokenResponseDto } from './dto/respone/refresh-token-respone.dto';
import { cookieConfiguration } from 'src/config';
import type { ConfigType } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(cookieConfiguration.KEY)
    private readonly cookieConfig: ConfigType<typeof cookieConfiguration>,
  ) {}

  @Throttle({ short: { ttl: 1000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate a user with email or phone and password.',
  })
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refresh_token, ...rest } = data;
    return rest;
  }

  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @Post('sign-up')
  @ApiOperation({
    summary: 'User sign up',
    description: 'Register a new user account with email or phone.',
  })
  async signUp(@Body() body: SignUpDto) {
    return this.authService.signUp(body);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token.',
  })
  async refreshToken(
    @GetUser() userPayload: TokenPayload,
  ): Promise<RefreshTokenResponseDto> {
    const data = await this.authService.refreshToken(userPayload);

    return data;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidate the current refresh token and log out the user.',
  })
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
  @ApiOperation({
    summary: 'Verify email or phone',
    description: 'Verify a user account using an OTP sent via email or SMS.',
  })
  async verifyUser(
    @Query() payload: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return await this.authService.verifyEmail(payload);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth login',
    description: 'Redirect to Google for OAuth2 authentication.',
  })
  async googleAuth() {}

  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth redirect',
    description: 'Callback URL for Google OAuth2 authentication.',
  })
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refresh_token, ...rest } = data;
    return rest;
  }

  @Post('forget-password')
  @ApiOperation({
    summary: 'Forget password',
    description:
      'Request a password reset OTP for a given email or phone number.',
  })
  async forgetPassword(
    @Body() body: ForgetPasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.forgetPassword(body);
  }

  @Throttle({ short: { ttl: 60000, limit: 2 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset the user password using an authenticated session.',
  })
  async resetPassword(
    @GetUser() user: TokenPayload,
    @Body() body: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.resetPassword(user.jti, body);
  }
}
