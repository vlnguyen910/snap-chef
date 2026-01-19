import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { TokenPayload } from 'src/common/interfaces';
import { WebSocketEvents } from 'src/common/constants';
import { getAppConfig } from 'src/config';

@WebSocketGateway({
  cors: {
    origin: getAppConfig().corsOrigins,
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(NotificationGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token = this.extractTokenFromHandshake(client);
    if (!token) {
      this.disconnect(client);
      return;
    }

    try {
      const payload: TokenPayload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      this.logger.log(`User connected: ${userId} (Socket ID: ${client.id})`);

      await client.join(userId);
    } catch (error) {
      this.logger.error('Invalid token during connection', error);
      this.disconnect(client);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    // 1. Check cookie first (Priority)
    if (client.handshake.headers.cookie) {
      const cookies = client.handshake.headers.cookie.split(';').reduce(
        (acc, cookie) => {
          const parts = cookie.trim().split('=');
          if (parts.length === 2) {
            const key = parts[0];
            const value = parts[1];
            if (key && value) {
              acc[key] = value;
            }
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      if (cookies['access_token']) {
        return cookies['access_token'];
      }
    }

    // 2. Check auth header (Bearer)
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }

    // 3. Check query param
    const token = client.handshake.query.token as string;
    if (token) {
      return token;
    }

    return undefined;
  }

  private disconnect(client: Socket) {
    client.emit(WebSocketEvents.ERROR, 'Unauthorized');
    client.disconnect();
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(userId).emit(event, data);
  }
}
