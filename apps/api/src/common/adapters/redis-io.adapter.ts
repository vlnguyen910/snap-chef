import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import { Logger, INestApplicationContext } from '@nestjs/common';

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

    try {
      this.logger.log(`Connecting to Redis using URL (masked): ${(url || '').replace(/:\/\/.*@/, '://***@')}`);
      const pubClient = createClient({ url });
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => this.logger.error('Redis Pub Client Error', err));
      subClient.on('error', (err) => this.logger.error('Redis Sub Client Error', err));

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Successfully connected to Redis and initialized adapter');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      // Don't rethrow if you want the app to start without Redis (though typically fatal for websockets)
      // For now, let's log and maybe allow it to fail eventually or keep retry logic in main
      throw error; 
    }
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
    return server;
  }
}
