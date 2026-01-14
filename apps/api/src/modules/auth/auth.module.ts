import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { jwtConfiguration } from 'src/common/config/jwt.config';
import { RedisModule } from 'src/redis/redis.module';
import { MailModule } from '../mail/mail.module';
import { RefreshTokenStrategy } from 'src/common/strategies/refresh-token.strategy';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { GoogleStrategy } from 'src/common/strategies/google.strategy';
import { OauthModule } from '../oauth-accounts/oauth.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [jwtConfiguration.KEY],
      useFactory: (jwtConfig: ConfigType<typeof jwtConfiguration>) => ({
        global: true,
        secret: jwtConfig.secret,
      }),
    }),
    UsersModule,
    RedisModule,
    MailModule,
    OauthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule { }
