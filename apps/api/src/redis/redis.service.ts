import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private client: Redis) { }

  private logger = new Logger(RedisService.name);

  async setCache(key: string, data: any, ttl?: number) {
    const stringValue = JSON.stringify(data);
    if (ttl) {
      await this.client.set(key, stringValue, 'EX', ttl);
    } else {
      await this.client.set(key, stringValue);
    }

    this.logger.log(`Cache key ${key} has been set`);
  }

  async getCache(key: string) {
    const stringData = await this.client.get(key);
    if (stringData) {
      this.logger.log(`Cache key ${key} hit`);
      return JSON.parse(stringData);
    }

    return null;
  }

  async delCache(key: string) {
    this.logger.log(`Cache key ${key} is invalidate`);
    await this.client.del(key);
  }
}

