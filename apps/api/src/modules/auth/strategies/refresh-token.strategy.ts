import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfiguration } from '../../../config';
import { TokenPayload } from '../../../common/interfaces';
import type { ConfigType } from '@nestjs/config';
import { JwtTokenType } from '../../../common/enums';
import { RedisService } from 'src/common/redis/redis.service';
import { ErrorMessages } from 'src/common/constants';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
          return request?.cookies?.refresh_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: TokenPayload) {
    if (payload.type !== JwtTokenType.RefreshToken) {
      throw new UnauthorizedException(ErrorMessages.INVALID_TOKEN_TYPE);
    }

    if (!payload.jti || typeof payload.jti !== 'string') {
      throw new UnauthorizedException(ErrorMessages.MISSING_OR_INVALID_JTI);
    }

    // Kiểm tra token có bị blacklist không
    const blacklistKey = `blacklist:${payload.jti}`;
    const isBlacklisted = await this.redisService.getCache(blacklistKey);

    if (isBlacklisted) {
      throw new UnauthorizedException(ErrorMessages.TOKEN_REVOKED);
    }

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      is_verified: payload.is_verified,
      jti: payload.jti,
    };
  }
}
