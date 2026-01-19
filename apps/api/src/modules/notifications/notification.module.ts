import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';
import { PrismaModule } from 'src/common/db/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfiguration } from 'src/config';
import { ConfigType } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [jwtConfiguration.KEY],
      useFactory: (jwtConfig: ConfigType<typeof jwtConfiguration>) => ({
        secret: jwtConfig.secret,
      }),
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
