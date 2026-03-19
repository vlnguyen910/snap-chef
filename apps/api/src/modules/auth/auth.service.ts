import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/request/login.dto';
import argon2 from 'argon2';
import { TokenPayload } from '../../common/interfaces';
import { JwtTokenType } from '../../common/enums';
import { ErrorMessages } from '../../common/constants';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { OAuthProvider, User, UserRoles } from 'src/generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';
import type { ConfigType } from '@nestjs/config';
import { jwtConfiguration } from 'src/config';
import { LoginResponseDto } from './dto/respone/login-respone.dto';
import { SignUpDto } from './dto/request/sign-up.dto';
import { RefreshTokenResponseDto } from './dto/respone/refresh-token-respone.dto';
import { RedisService } from 'src/common/redis/redis.service';
import { MailerService } from '../mail/mail.service';
import { VerifyEmailDto } from './dto/request/verify-email.dto';
import { OauthService } from '../oauth-accounts/oauth.service';
import { ForgetPasswordDto } from './dto/request/forget-password.dto';
import { ResetPasswordDto } from './dto/request/reset-password.dto';

interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  provider_id: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
    private redis: RedisService,
    private mailService: MailerService,
    private oauthService: OauthService,
  ) {}

  async login(body: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = body;
    const user = await this.userService.findByEmail(email);
    if (!user || !user.password)
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    if (!user.is_active)
      throw new ForbiddenException(ErrorMessages.USER_BANNED);

    const isMatchPassword = await argon2.verify(user.password, password);
    if (!isMatchPassword)
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);

    //TODO: Update later
    if (!user.is_verified)
      throw new UnauthorizedException(ErrorMessages.EMAIL_NOT_VERIFIED);

    return this.manageUserToken(user);
  }

  async signUp(body: SignUpDto): Promise<{
    message: string;
    requiresEmailVerification: boolean;
  }> {
    const { email, username, password, avatar_url } = body;
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ForbiddenException(ErrorMessages.EMAIL_ALREADY_IN_USE);
    }

    const hashedPassword = await argon2.hash(password);
    const newUser = await this.userService.create({
      email,
      username,
      password: hashedPassword,
      avatar_url,
      role: UserRoles.USER,
    });

    const token = uuidv4();
    const cacheKey = `verify_email:${token}`;
    await this.redis.setCache(cacheKey, newUser.id, 15);

    await this.mailService.sendUserConfirmation(newUser, token);

    return {
      message: 'Account created. Please verify your email before signing in.',
      requiresEmailVerification: true,
    };
  }

  async verifyEmail(payload: VerifyEmailDto) {
    const { token } = payload;
    const cacheKey = `verify_email:${token}`;
    const userId = await this.redis.getCache<string>(cacheKey);

    if (!userId) throw new BadRequestException(ErrorMessages.INVALID_TOKEN);

    await this.userService.update(userId, userId, {
      is_verified: true,
    });

    await this.redis.delCache(cacheKey);

    return { message: 'Your email has been verified' };
  }

  async refreshToken(
    userPayload: TokenPayload,
  ): Promise<RefreshTokenResponseDto> {
    const access_token = await this.generateToken(
      userPayload,
      JwtTokenType.AccessToken,
      this.jwtConfig.accessTokenExpiresIn,
    );

    return { access_token };
  }

  async logout(jti: string): Promise<void> {
    const blacklistKey = `blacklist:${jti}`;

    const ttlInDays = 30;
    await this.redis.setCache(blacklistKey, 'true', ttlInDays * 24 * 60);
  }

  async googleLogin(req: { user: GoogleUser }): Promise<LoginResponseDto> {
    if (!req.user) throw new NotFoundException(ErrorMessages.NO_GOOGLE_USER);

    const { email, firstName, lastName, picture, provider_id } = req.user;

    // Check user is registered with this email
    let user = await this.userService.findByEmail(email);

    if (!user) {
      user = await this.userService.create({
        email,
        password: null,
        username: `${firstName} ${lastName}`,
        avatar_url: picture,
        role: UserRoles.USER,
        is_verified: true,
      });

      await this.oauthService.createOauthAccount({
        provider: OAuthProvider.GOOGLE,
        provider_id,
        user_id: user.id,
      });
    } else {
      // Check is link with Google
      const oauthAccount = await this.oauthService.findOauthAccount(
        user.id,
        OAuthProvider.GOOGLE,
      );

      if (!oauthAccount) {
        await this.oauthService.createOauthAccount({
          provider: OAuthProvider.GOOGLE,
          provider_id,
          user_id: user.id,
        });
      } else if (oauthAccount.provider_id !== provider_id) {
        throw new ConflictException(ErrorMessages.GOOGLE_ACCOUNT_CONFLICT);
      }
    }

    const cacheKey = `user:${user.id}`;
    await this.redis.setCache(cacheKey, user, 60);

    return this.manageUserToken(user);
  }

  async forgetPassword(body: ForgetPasswordDto): Promise<{ message: string }> {
    const { email } = body;
    const user = await this.userService.findByEmail(email);

    if (user) {
      const token = uuidv4();

      const cacheKey = `reset_password:${token}`;
      await this.redis.setCache(cacheKey, user.id, 15);

      await this.mailService.sendResetPassword(user, token);
    }

    return {
      message: 'An email was sent to you. Check it to reset your password',
    };
  }

  async resetPassword(
    queryToken: string,
    body: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const token = queryToken || body.token;
    const { password } = body;

    if (!token) {
      throw new BadRequestException(ErrorMessages.INVALID_OR_EXPIRED_TOKEN);
    }

    const cacheKey = `reset_password:${token}`;
    const userId = await this.redis.getCache<string>(cacheKey);

    if (!userId) {
      throw new BadRequestException(ErrorMessages.INVALID_OR_EXPIRED_TOKEN);
    }

    const hashedPassword = await argon2.hash(password);

    await this.userService.update(userId, userId, {
      password: hashedPassword,
    });

    await this.redis.delCache(cacheKey);

    return { message: 'Password has been reset successfully' };
  }

  async isTokenABlacklisted(jti: string): Promise<boolean> {
    const blacklistKey = `blacklist:${jti}`;
    const isBlacklisted = await this.redis.getCache(blacklistKey);
    return !!isBlacklisted;
  }

  private async manageUserToken(user: User) {
    const jti = uuidv4();
    const tokenPayload: TokenPayload = {
      sub: user.id,
      jti,
      username: user.username,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      type: JwtTokenType.AccessToken, // Placeholder, type is overwritten by generateToken
    };

    const [access_token, refresh_token] = await Promise.all([
      this.generateToken(
        tokenPayload,
        JwtTokenType.AccessToken,
        this.jwtConfig.accessTokenExpiresIn,
      ),
      this.generateToken(
        tokenPayload,
        JwtTokenType.RefreshToken,
        this.jwtConfig.refreshTokenExpiresIn,
      ),
    ]);

    return { access_token, refresh_token };
  }

  private async generateToken(
    payload: TokenPayload,
    type: JwtTokenType,
    expiresIn: number | string,
  ) {
    const tokenPayload: TokenPayload = {
      ...payload,
      type,
    };

    const options: Partial<JwtSignOptions> = {
      expiresIn: expiresIn,
    } as unknown as JwtSignOptions;

    return this.jwtService.signAsync(tokenPayload, options);
  }
}
