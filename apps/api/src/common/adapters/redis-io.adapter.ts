import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Logger, INestApplicationContext } from '@nestjs/common';
import { getRedisOptions } from '../../config/redis.options';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const url = this.configService.get<string>('redis.url');
    const keepAlive = this.configService.get<number>('redis.keepAlive');

    if (!url) {
        throw new Error('Redis URL is not defined');
    }

    try {
      this.logger.log(
        `Connecting to Redis using URL (masked): ${(url || '').replace(/:\/\/.*@/, '://***@')}`,
      );

      const redisOptions = getRedisOptions(keepAlive || 30000);

      const pubClient = new Redis(url, redisOptions);
      const subClient = new Redis(url, redisOptions);

      pubClient.on('error', (err) =>
        this.logger.error('Redis Pub Client Error', err),
      );
      subClient.on('error', (err) =>
        this.logger.error('Redis Sub Client Error', err),
      );
      
      // ioredis connects automatically, but we can wait for ready
      await Promise.all([
         new Promise<void>((resolve, reject) => {
             pubClient.once('ready', () => resolve());
             pubClient.once('error', reject);
         }),
         new Promise<void>((resolve, reject) => {
             subClient.once('ready', () => resolve());
             subClient.once('error', reject);
         })
      ]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log(
        'Successfully connected to Redis and initialized adapter',
      );
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
    return server;
  }
}
