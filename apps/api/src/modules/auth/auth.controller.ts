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
import { ForgetPasswordDto } from './dto/request/forget-password.dto';
import { ResetPasswordDto } from './dto/request/reset-password.dto';
import { RefreshTokenResponseDto } from './dto/respone/refresh-token-respone.dto';
import { cookieConfiguration } from 'src/config';
import type { ConfigType } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(cookieConfiguration.KEY)
    private readonly cookieConfig: ConfigType<typeof cookieConfiguration>,
  ) {}

  @Throttle({ short: { ttl: 1000, limit: 3 } })
  @ApiOperation({ summary: 'Login user and set refresh token cookie' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refresh_token, ...rest } = data;
    return rest;
  }

  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('sign-up')
  async signUp(@Body() body: SignUpDto) {
    return this.authService.signUp(body);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({
    status: 201,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiCookieAuth('refresh_token')
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @GetUser() userPayload: TokenPayload,
  ): Promise<RefreshTokenResponseDto> {
    const data = await this.authService.refreshToken(userPayload);

    return data;
  }

  @ApiOperation({ summary: 'Logout user and clear refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiBearerAuth()
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

  @ApiOperation({ summary: 'Verify user email using token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @Get('verify-email')
  async verifyUser(
    @Query() payload: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return await this.authService.verifyEmail(payload);
  }

  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {}

  @ApiOperation({ summary: 'Google OAuth callback' })
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refresh_token, ...rest } = data;
    return rest;
  }

  @ApiOperation({ summary: 'Send reset password email' })
  @ApiResponse({ status: 201, description: 'Reset email sent' })
  @Post('forget-password')
  async forgetPassword(
    @Body() body: ForgetPasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.forgetPassword(body);
  }

  @Throttle({ short: { ttl: 60000, limit: 2 } })
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 201, description: 'Password reset successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  async resetPassword(
    @GetUser() user: TokenPayload,
    @Body() body: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.resetPassword(user.jti, body);
  }
}
