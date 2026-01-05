import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/request/login.dto';
import argon2 from 'argon2';
import { TokenPayload } from '../../common/interfaces/auth.interface';
import { JwtTokenType } from '../../common/enums/jwt.enum';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { User, UserRoles } from 'src/generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';
import type { ConfigType } from '@nestjs/config';
import { jwtConfiguration } from 'src/common/config/jwt.config';
import { LoginResponseDto } from './dto/respone/login-respone.dto';
import { SignUpDto } from './dto/request/sign-up.dto';
import { RefreshTokenResponseDto } from './dto/respone/refresh-token-respone.dto';
import { RedisService } from 'src/redis/redis.service';
import { MailerService } from '../mail/mail.service';
import { VerifyEmailDto } from './dto/request/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
    private redis: RedisService,
    private mailService: MailerService,
  ) { }

  async login(body: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = body;
    const user = await this.userService.findByEmail(email);
    if (!user || !user.password)
      throw new UnauthorizedException('Email or password is incorrect');
    if (!user.is_active) throw new ForbiddenException('User has been banned');

    const isMatchPassword = await argon2.verify(user.password, password);
    if (!isMatchPassword)
      throw new UnauthorizedException('Email or password is incorrect');

    //TODO: Update later
    if (!user.is_verified)
      throw new UnauthorizedException('You need verify your email first');

    return this.manageUserToken(user);
  }

  async signUp(body: SignUpDto) {
    const { email, username, password, avatar_url } = body;
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ForbiddenException('Email is already in use');
    }

    const hashedPassword = await argon2.hash(password);
    const newUser = await this.userService.create({
      email,
      username,
      password: hashedPassword,
      avatar_url,
      role: UserRoles.USER,
    });

    const cacheKey = `verify_email:${newUser.id}`;
    const token: string = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.setCache(cacheKey, token, 10);

    await this.mailService.sendUserConfirmation(newUser, token);

    return { message: 'Check your mail to get otp code' };
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

  private async manageUserToken(user: User) {
    const jti = uuidv4();
    const tokenPayload = {
      sub: user.id,
      jti,
      username: user.username,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
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

  async verifyEmail(payload: VerifyEmailDto) {
    const { id, token } = payload;
    const cacheKey = `verify_email:${id}`;
    const cacheToken = await this.redis.getCache(cacheKey);

    if (!cacheToken || cacheToken !== token)
      throw new BadRequestException('Invalid Token');

    await this.userService.update(id, id, {
      is_verified: true,
    })

    await this.redis.delCache(cacheKey);

    return { message: 'Your email has been verified' };
  }

  private async generateToken(
    payload: Partial<TokenPayload>,
    type: JwtTokenType,
    expiresIn: number | string,
  ) {
    const tokenPayload: TokenPayload = {
      sub: payload.sub!,
      email: payload.email!,
      username: payload.username!,
      role: payload.role!,
      is_verified: payload.is_verified!,
      type,
      jti: payload.jti!,
    };

    const options: Partial<JwtSignOptions> = {
      expiresIn: expiresIn,
    } as unknown as JwtSignOptions;

    return this.jwtService.signAsync(tokenPayload, options);
  }
}
