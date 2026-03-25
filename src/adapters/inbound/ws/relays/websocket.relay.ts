import { Server, Socket } from 'socket.io';

/**
 * Fluent helper for socket emission using native Rooms for scalability.
 * Replaces manual iteration over Map with Socket.io optimized internal targeting.
 */
export class WebsocketRelay {
  private server: Server;
  private targetRoom?: string;

  constructor(server: Server) {
    this.server = server;
  }

  /**
   * Targets a specific tunnel (User/Session) within a specific account.
   * Format: room:accountId:client
   */
  public toRoom(accountId: string | number, client: string | number): this {
    this.targetRoom = `room:${accountId}:${client}`;
    return this;
  }

  /**
   * Targets all connections belonging to a specific account/backend.
   * Format: account:accountId
   */
  public toAccount(accountId: string | number): this {
    this.targetRoom = `account:${accountId}`;
    return this;
  }

  /**
   * Targets a specific role's room.
   */
  public toRole(role: string): this {
    this.targetRoom = `role:${role}`;
    return this;
  }

  /**
   * Resets the target to broadcast to everyone in the namespace.
   */
  public toAll(): this {
    this.targetRoom = undefined;
    return this;
  }

  /**
   * Executes the emission to the targeted room or the entire namespace.
   */
  public emit(event: string, payload: any): void {
    if (payload === undefined || payload === null) return;

    if (this.targetRoom) {
      this.server.to(this.targetRoom).emit(event, payload);
    } else {
      this.server.emit(event, payload);
    }

    // Reset state for subsequent calls
    this.targetRoom = undefined;
  }

  /**
   * Disconnects a client with an error message.
   */
  public static disconnect(socket: Socket, reason: string): void {
    socket.emit('error', { message: reason });
    socket.disconnect(true);
  }
}
