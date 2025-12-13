/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { registerAs } from '@nestjs/config';
import { APP_DEFAULTS } from '../constants/app.constrant';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export const jwtConfiguration = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET!,
  accessTokenExpiresIn:
    process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ||
    APP_DEFAULTS.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn:
    process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ||
    APP_DEFAULTS.REFRESH_TOKEN_EXPIRES_IN,
}));
