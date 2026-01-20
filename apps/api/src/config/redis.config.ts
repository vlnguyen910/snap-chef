import { registerAs } from '@nestjs/config';

export const redisConfiguration = registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
}));
