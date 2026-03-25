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
  @WebSocketServer()
  protected server: Server;

  protected readonly logger: Logger;
  protected readonly mode: 'public' | 'private';

  constructor(
    protected readonly guard: WebsocketGuard,
    gatewayName: string,
    mode: 'public' | 'private' = 'private',
  ) {
    this.logger = new Logger(gatewayName);
    this.mode = mode;
  }

  /**
   * Provides a fluent relay for broadcasting using native Rooms.
   */
  protected get socket(): WebsocketRelay {
    if (!this.server) throw new Error('Server not initialized yet');
    return new WebsocketRelay(this.server);
  }

  /**
   * Handles incoming connections, API Key verification, and hierarchical room assignment.
   */
  async handleConnection(client: Socket) {
    const account = await this.guard.verifyApiKey(client, this.mode);

    // Guard check for private gateways
    if (!account && this.mode === 'private') {
      this.logger.log(`Anonymous client rejected: ${client.id}`);
      return;
    }

    // Join Global Room by mode
    const globalRoom = `mode:${this.mode}`;
    await client.join(globalRoom);

    if (account) {
      const accountId = String(account.id);
      const roomId = client.data.user?.client;

      // Join Account-based Room (All connections for this backend)
      await client.join(`account:${accountId}`);

      // Join Identity-based Tunnel Room (Account + User Session)
      if (roomId) {
        await client.join(`room:${accountId}:${roomId}`);
      }

      // Join Role-based Room
      if (account.role) {
        await client.join(`role:${account.role.value}`);
      }

      this.logger.log(
        `Account ${accountId} connected (Room: ${roomId ?? 'none'}). Socket: ${client.id} joined ${globalRoom}`,
      );
    } else {
      this.logger.log(
        `Anonymous client connected on public namespace: ${client.id}`,
      );
    }

    // Handle Custom Query Rooms
    const room = client.handshake.query.room as string | undefined;
    if (room) {
      await client.join(room);
      this.logger.log(`Client ${client.id} joined custom room: ${room}`);
    }
  }

  /**
   * Handles disconnections. Native rooms are cleaned up automatically.
   */
  handleDisconnect(client: Socket) {
    const roomId = client.data?.user?.id
      ? String(client.data.user.id)
      : 'Anonymous';

    const room = client.handshake.query.room as string | undefined;
    if (room) {
      this.server.to(room).emit('user-left', {
        message: `User left: ${client.id}`,
        account: client.data?.user?.id,
      });
    }

    this.logger.log(`Client ${client.id} (${roomId}) disconnected`);
  }
}
