/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
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
import { User } from 'src/generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';
import type { ConfigType } from '@nestjs/config';
import { jwtConfiguration } from 'src/common/config/jwt.config';
import { LoginResponseDto } from './dto/respone/login-respone.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
  ) {}

  async login(body: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = body;
    const user = await this.userService.findByEmail(email);
    if (!user || !user.password)
      throw new UnauthorizedException('Email or password is incorrect');
    if (!user.is_active) throw new ForbiddenException('User has been banned');

    const isMatchPassword = await argon2.verify(user.password, password);
    if (!isMatchPassword)
      throw new UnauthorizedException('Email or password is incorrect');

    return this.manageUserToken(user);
  }

  private async manageUserToken(user: User) {
    const jti = uuidv4();
    const tokenPayload = {
      sub: user.id,
      jti,
      username: user.username,
      email: user.email,
      role: user.role,
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
    payload: Partial<TokenPayload>,
    type: JwtTokenType,
    expiresIn: number | string,
  ) {
    const tokenPayload: TokenPayload = {
      sub: payload.sub!,
      email: payload.email!,
      username: payload.username!,
      role: payload.role!,
      type,
      jti: payload.jti!,
    };

    const options: Partial<JwtSignOptions> = {
      expiresIn: expiresIn,
    } as unknown as JwtSignOptions;

    return this.jwtService.signAsync(tokenPayload, options);
  }
}
