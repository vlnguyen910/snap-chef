import { RedisOptions } from 'ioredis';

export const getRedisOptions = (keepAlive: number): RedisOptions => ({
  keepAlive,
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  },
});
