import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/db/prisma.module';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [],
  providers: [CommentsService],
  exports: [CommentsService],
})

export class CommentsModule {}
