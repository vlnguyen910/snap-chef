import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private client: Redis) { }

  async setCache(key: string, data: any, ttl?: number) {
    const stringValue = JSON.stringify(data);
    if (ttl) {
      await this.client.set(key, stringValue, 'EX', ttl);
    } else {
      await this.client.set(key, stringValue);
    }

    console.log(`Cache key: ${key} has been set`);
  }

  async getCache(key: string) {
    const stringData = await this.client.get(key);
    if (stringData) {
      console.log('Cache hit');
      return JSON.parse(stringData);
    }

    return null;
  }

  async delCache(key: string) {
    console.log(`Cache ${key} is invalidate`);
    await this.client.del(key);
  }
}

