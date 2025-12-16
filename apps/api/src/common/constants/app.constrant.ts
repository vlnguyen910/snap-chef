import { NodeEnv } from '../enums/enviroment.enum';

export const APP_DEFAULTS = {
  NODE_ENV: NodeEnv.Local,
  APP_NAME: 'Snap Chef',
  APP_PORT: 8080,
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
};
