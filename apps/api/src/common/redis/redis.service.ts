import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private client: Redis) { }

  private logger = new Logger(RedisService.name);

  async setCache(key: string, data: any, ttl?: number) {
    const stringValue = JSON.stringify(data);
    if (ttl) {
      await this.client.setex(key, ttl * 60, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }

    this.logger.log(
      `Cache key ${key} has been set with TTL ${ttl || 'none'} minutes`,
    );
  }

  async getCache<T>(key: string): Promise<T | null> {
    const stringData = await this.client.get(key);
    if (stringData) {
      this.logger.log(`Cache key ${key} hit`);
      return JSON.parse(stringData) as T;
    }

    this.logger.log(`Cache key ${key} miss`);
    return null;
  }

  async delCache(key: string) {
    await this.client.del(key);
    this.logger.log(`Cache key ${key} is invalidate`);
  }
}
