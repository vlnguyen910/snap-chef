import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { getAppConfig } from './common/config/app.config';

getAppConfig()
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { appName, appPort } = getAppConfig();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.enableCors();
  app.setGlobalPrefix('api');
  await app.listen(appPort);
}
void bootstrap();
