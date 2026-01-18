import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { jwtConfiguration } from 'src/config';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust this in production
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(NotificationGateway.name);
  // In-memory map for basic implementation. Ideally use RedisAdapter for scaling.
  private userSocketMap = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    // Note: We might need to inject config if we verify manually, but jwtService.verify handles it if configured globally
  ) {}

  async handleConnection(client: Socket) {
    const token = this.extractTokenFromHandshake(client);
    if (!token) {
      this.disconnect(client);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub; // Assuming 'sub' holds the userId
      this.userSocketMap.set(userId, client.id);
      this.logger.log(`User connected: ${userId} (Socket ID: ${client.id})`);
      
      // Optional: Join a room with userId
      client.join(userId);
    } catch (error) {
      this.logger.error('Invalid token during connection', error);
      this.disconnect(client);
    }
  }

  handleDisconnect(client: Socket) {
    // We need to find the userId for this socketId to remove it from the map
    // This is O(N) with a simple map. 
    // Optimization: Store socketId -> userId map as well, or just rely on rooms.
    // If we use rooms (client.join(userId)), we actually don't strictly need the map for sending 
    // if we use this.server.to(userId).emit(...)
    
    // Cleaning up map
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        this.userSocketMap.delete(userId);
        this.logger.log(`User disconnected: ${userId}`);
        break;
      }
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    // Check auth header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }
    
    // Check query param
    const token = client.handshake.query.token as string;
    if (token) {
      return token;
    }
    
    return undefined;
  }

  private disconnect(client: Socket) {
    client.emit('error', 'Unauthorized');
    client.disconnect();
  }

  /**
   * Send a notification to a specific user
   * @param userId 
   * @param event 
   * @param data 
   */
  sendToUser(userId: string, event: string, data: any) {
    // Using rooms approach is cleaner and handles multiple sockets per user if they join the room
    this.server.to(userId).emit(event, data);
    
    // Fallback/log if needed
    // const socketId = this.userSocketMap.get(userId);
    // if (socketId) {
    //   this.server.to(socketId).emit(event, data);
    // }
  }
}
