import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/db/prisma.module';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CollectionController],
  providers: [CollectionService],
  exports: [],
})
export class CollectionModule { }
