import { registerAs } from '@nestjs/config';

export const redisConfiguration = registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000', 10),
}));
