import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { jwtConfiguration } from 'src/common/config/jwt.config';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [jwtConfiguration],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfiguration)],
      useFactory: (jwtConfig: ConfigType<typeof jwtConfiguration>) => ({
        global: true,
        secret: jwtConfig.secret,
      }),
      inject: [jwtConfiguration.KEY],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
