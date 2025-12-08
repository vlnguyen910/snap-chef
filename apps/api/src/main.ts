import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getAppConfig } from './common/config/app.config';

async function bootstrap() {
  const { appName, appPort } = getAppConfig();
  const app = await NestFactory.create<INestApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  await app.init();
  await app.listen(appPort);
  console.log(`${appName} is running on port ${appPort}`);
}

void bootstrap();
