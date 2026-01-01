import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { PrismaModule } from 'src/db/prisma.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { jwtConfiguration } from 'src/common/config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { CommentsModule } from '../comments/comments.module';
import { RedisModule } from 'src/redis/redis.module'

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
})
export class RecipesModule { }
