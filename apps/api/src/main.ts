import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { getAppConfig } from './config';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

getAppConfig();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { appPort, corsOrigins } = getAppConfig();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const configService = app.get(ConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.listen(appPort);
}
void bootstrap();
