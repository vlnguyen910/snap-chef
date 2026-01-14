import { Module } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { PrismaModule } from 'src/db/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OauthService],
  exports: [OauthService],
})
export class OauthModule {}
