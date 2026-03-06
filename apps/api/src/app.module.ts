import { Module } from '@nestjs/common';
import { PrismaService } from './common/db/prisma.service';
import { ScheduleModule } from '@nestjs/schedule';
import { RecipesModule } from './modules/recipes/recipes.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { RedisModule as IoredisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { RedisModule } from './common/redis/redis.module';
import {
  redisConfiguration,
  jwtConfiguration,
  cookieConfiguration,
  googleConfiguration,
} from './config';
import { getRedisOptions } from './config/redis.options';
import { UsersModule } from './modules/users/users.module';
import { CollectionModule } from './modules/collections/collection.module';
import { AppController } from './app.controller';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { CustomThrottlerGuard } from './common/guards';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        jwtConfiguration,
        redisConfiguration,
        cookieConfiguration,
        googleConfiguration,
      ],
    }),
    IoredisModule.forRootAsync({
      inject: [redisConfiguration.KEY],
      useFactory: (redisConfig: ConfigType<typeof redisConfiguration>) => ({
        type: 'single',
        url: redisConfig.url,
        options: getRedisOptions(redisConfig.keepAlive),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [redisConfiguration.KEY],
      useFactory: (redisConfig: ConfigType<typeof redisConfiguration>) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: 5,
          },
          {
            name: 'long',
            ttl: 60000,
            limit: 20,
          },
        ],
        storage: new ThrottlerStorageRedisService(redisConfig.url),
      }),
    }),
    RedisModule,
    UsersModule,
    CommentsModule,
    RecipesModule,
    IngredientsModule,
    AuthModule,
    CollectionModule,
    AdminModule,
    ReportsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    PrismaService,
  ],
})
export class AppModule {}
