import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfiguration } from '../../../config';
import { TokenPayload } from '../../../common/interfaces';
import type { ConfigType } from '@nestjs/config';
import { RedisService } from 'src/common/redis/redis.service';
import { ErrorMessages } from 'src/common/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: TokenPayload): Promise<TokenPayload> {
    if (!payload.jti || typeof payload.jti !== 'string') {
      throw new UnauthorizedException(ErrorMessages.MISSING_OR_INVALID_JTI);
    }

    const blacklistKey = `blacklist:${payload.jti}`;
    const isBlacklisted = await this.redisService.getCache(blacklistKey);

    if (isBlacklisted) {
      throw new UnauthorizedException(ErrorMessages.TOKEN_REVOKED);
    }

    return {
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      is_verified: payload.is_verified,
      type: payload.type,
      jti: payload.jti,
    };
  }
}
