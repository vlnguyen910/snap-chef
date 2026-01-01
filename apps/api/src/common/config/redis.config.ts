import { registerAs } from "@nestjs/config";

export const redisConfiguration = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
}));

