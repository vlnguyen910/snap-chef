import { registerAs } from '@nestjs/config';

export const getAppConfig = () => ({
  appName: process.env.APP_NAME || 'Snap Chef API',
  appPort: +(process.env.APP_PORT as string) || 8080,
});

export const appConfiguration = registerAs('app', getAppConfig);
