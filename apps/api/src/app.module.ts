import { Module } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';
import { RecipesModule } from './modules/recipes/recipes.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        options: {
          host: 'localhost',
          port: 6379,
        }
      })
    }),
    CommentsModule,
    RecipesModule,
    IngredientsModule,
    AuthModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule { }
