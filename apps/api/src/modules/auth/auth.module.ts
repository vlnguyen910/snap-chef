import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { jwtConfiguration } from 'src/config';
import { MailModule } from '../mail/mail.module';
import { RefreshTokenStrategy } from 'src/modules/auth/strategies/refresh-token.strategy';
import { JwtStrategy } from 'src/modules/auth/strategies/jwt.strategy';
import { GoogleStrategy } from 'src/modules/auth/strategies/google.strategy';
import { OauthModule } from '../oauth-accounts/oauth.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [jwtConfiguration.KEY],
      useFactory: (jwtConfig: ConfigType<typeof jwtConfiguration>) => ({
        secret: jwtConfig.secret,
      }),
    }),
    UsersModule,
    MailModule,
    OauthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
