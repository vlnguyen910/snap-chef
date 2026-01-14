import { Module } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';
import { RecipesModule } from './modules/recipes/recipes.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { redisConfiguration } from './common/config/redis.config';
import { jwtConfiguration } from './common/config/jwt.config';
import { cookieConfiguration } from './common/config/cookie.config';
import { googleConfiguration } from './common/config/google.config';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        jwtConfiguration,
        redisConfiguration,
        cookieConfiguration,
        googleConfiguration,
      ],
    }),
    RedisModule.forRootAsync({
      inject: [redisConfiguration.KEY],
      useFactory: (redisConfig: ConfigType<typeof redisConfiguration>) => ({
        type: 'single',
        options: {
          host: redisConfig.host,
          port: redisConfig.port,
        },
      }),
    }),
    UsersModule,
    CommentsModule,
    RecipesModule,
    IngredientsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
