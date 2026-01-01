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
import { RedisService } from 'src/redis/redis.service';
import { w } from 'node_modules/@faker-js/faker/dist/airline-DF6RqYmq';

@Module({
  imports: [
    PrismaModule,
    IngredientsModule,
    PassportModule,
    ConfigModule.forFeature(jwtConfiguration),
    UsersModule,
    CommentsModule,
  ],
  controllers: [RecipesController],
  providers: [RecipesService, JwtStrategy, RedisService],
})
export class RecipesModule { }
