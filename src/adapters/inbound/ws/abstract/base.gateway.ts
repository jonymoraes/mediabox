import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebsocketGuard } from '../guards/websocket.guard';
import { WebsocketRelay } from '../relays/websocket.relay';

export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  protected readonly usersMap: Map<string, Set<Socket>> = new Map();
  protected readonly logger: Logger;
  protected readonly mode: 'public' | 'private';

  @WebSocketServer()
  protected server: Server;

  constructor(
    protected readonly guard: WebsocketGuard,
    gatewayName: string,
    mode: 'public' | 'private' = 'private',
  ) {
    this.logger = new Logger(gatewayName);
    this.mode = mode;
  }

  protected get socket(): WebsocketRelay {
    if (!this.server) throw new Error('Server not initialized yet');
    return new WebsocketRelay(this.server, this.usersMap);
  }

  /**
   * @description Handles new WebSocket connections.
   * Authenticates via API Key through the WebsocketGuard.
   */
  async handleConnection(client: Socket) {
    const account = await this.guard.verifyApiKey(client, this.mode);

    if (!account && this.mode === 'private') {
      this.logger.log(`Anonymous client tried to connect: ${client.id}`);
      return;
    }

    const accountId = account?.id ? String(account.id) : null;

    if (accountId) {
      if (!this.usersMap.has(accountId))
        this.usersMap.set(accountId, new Set());
      this.usersMap.get(accountId)!.add(client);
      this.logger.log(
        `account ${accountId} connected with socket ${client.id} (total ${
          this.usersMap.get(accountId)!.size
        })`,
      );
    } else {
      this.logger.log(
        `Anonymous client connected on public namespace: ${client.id}`,
      );
    }

    const room = client.handshake.query.room as string | undefined;
    if (room) {
      void client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
    }
  }

  /**
   * @description Handles client disconnection and cleans up maps/rooms.
   */
  handleDisconnect(client: Socket) {
    const accountId = client.data?.user?.id
      ? String(client.data.user.id)
      : null;

    const room = client.handshake.query.room as string | undefined;
    if (room) {
      void client.leave(room);
      this.server.to(room).emit('user-left', {
        message: `User left: ${client.id}`,
      });
      this.logger.log(`Client ${client.id} left room ${room}`);
    }

    if (!accountId || !this.usersMap.has(accountId)) return;

    const sockets = this.usersMap.get(accountId)!;
    sockets.delete(client);
    if (sockets.size === 0) this.usersMap.delete(accountId);

    this.logger.log(
      `account ${accountId} disconnected socket ${client.id} (remaining ${sockets.size})`,
    );
  }
}
