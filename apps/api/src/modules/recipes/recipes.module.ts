import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { PrismaModule } from 'src/common/db/prisma.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { JwtStrategy } from 'src/modules/auth/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { jwtConfiguration } from 'src/config';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { CommentsModule } from '../comments/comments.module';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    IngredientsModule,
    PassportModule,
    ConfigModule.forFeature(jwtConfiguration),
    UsersModule,
    CommentsModule,
    RedisModule,
  ],
  controllers: [RecipesController],
  providers: [RecipesService, JwtStrategy],
  exports: [RecipesService],
})
export class RecipesModule {}
