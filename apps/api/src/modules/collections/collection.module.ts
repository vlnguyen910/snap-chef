import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/db/prisma.module';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';
import { UsersModule } from '../users/users.module';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [PrismaModule, UsersModule, RecipesModule],
  controllers: [CollectionController],
  providers: [CollectionService],
  exports: [],
})
export class CollectionModule {}
