import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({ cors: { origin: allowedOrigins } })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || String(client.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      if (payload.tenantId) {
        client.join(`tenant:${payload.tenantId}`);
      }
      if (payload.sub) {
        client.join(`user:${payload.sub}`);
      }
      console.log(`Socket client connected: ${client.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket client disconnected: ${client.id}`);
  }

  broadcast(event: string, payload: any) {
    if (this.server) {
      const tenantId = payload?.tenantId || payload?.appointment?.tenantId;
      if (tenantId) {
        this.server.to(`tenant:${tenantId}`).emit(event, payload);
        return;
      }
      this.server.emit(event, payload);
    }
  }
}
