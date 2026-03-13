import { Server, Socket } from 'socket.io';

/**
 * @file socket.helper.ts
 * @description Fluent helper for socket emission per Gateway
 */
export class WebsocketRelay {
  private server: Server;
  private usersMap: Map<string, Set<Socket>>;
  private targetUserId?: string | number; // Cambiado a string | number
  private targetRole?: string;

  constructor(server: Server, usersMap: Map<string, Set<Socket>>) {
    this.server = server;
    this.usersMap = usersMap;
  }

  /**
   * @description Emit to a specific user
   * @param userId User ID (UUID or Number)
   */
  toUser(userId: string | number) {
    this.targetUserId = userId;
    return this;
  }

  /**
   * @description Emit to all users
   */
  toAll() {
    this.targetUserId = undefined;
    return this;
  }

  /**
   * @description Emit to all users with a specific role
   * @param role Role name
   */
  toRole(role: string) {
    this.targetRole = role;
    return this;
  }

  /**
   * @description Emit to a specific user, all users, or all users with a specific role
   */
  emit(event: string, payload: any) {
    if (!payload) return;

    if (this.targetUserId !== undefined) {
      // Emit to a specific user
      const sockets = this.usersMap.get(String(this.targetUserId));
      sockets?.forEach((socket) => {
        if (this.targetRole && socket.data.user?.role !== this.targetRole)
          return;
        socket.emit(event, payload);
      });
    } else if (this.targetRole) {
      // Emit to all users with a specific role
      for (const sockets of this.usersMap.values()) {
        sockets.forEach((socket) => {
          if (socket.data.user?.role !== this.targetRole) return;
          socket.emit(event, payload);
        });
      }
    } else {
      // Emit to all users
      this.server.emit(event, payload);
    }

    this.targetUserId = undefined;
    this.targetRole = undefined;
  }

  /**
   * @description Disconnects a client with an error message
   */
  static disconnect(socket: Socket, reason: string) {
    socket.emit('error', { message: reason });
    socket.disconnect(true);
  }
}
