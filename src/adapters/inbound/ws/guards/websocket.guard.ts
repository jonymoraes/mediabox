import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Domain logic & Exceptions
import { WebsocketRelay } from '../relays/websocket.relay';
import {
  InvalidTokenException,
  NotAuthorizedException,
} from '@/src/domain/identity/exceptions/account.exceptions';
import { DomainException } from '@/src/domain/shared/exceptions/domain.exceptions';
import { Account } from '@/src/domain/identity/entities/account.entity';

@Injectable()
export class WebsocketGuard {
  private readonly logger = new Logger(WebsocketGuard.name);

  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
  ) {}

  /**
   * Verifies the client's API Key and hydrates the socket data.
   * Extracts the roomId from headers to establish a secure tunnel.
   * Updates transfer quotas on successful connection.
   */
  async verifyApiKey(
    client: Socket,
    mode: 'public' | 'private' = 'private',
  ): Promise<Account | null> {
    try {
      const apiKey = client.handshake.headers['x-media-key'] as
        | string
        | undefined;

      const clientId = client.handshake.headers['x-media-client'] as
        | string
        | undefined;

      if (!apiKey) throw new InvalidTokenException();

      const account = await this.accountPort.findByApiKey(apiKey);
      if (!account) throw new InvalidTokenException();

      if (!account.isActive()) throw new NotAuthorizedException();

      // Update transfer quota
      const quota = await this.quotaPort.findByAccountId(account.id);
      if (quota) {
        quota.addTransfer(BigInt(0));
        await this.quotaPort.save(quota);
      }

      // Hydrate client data for Gateway use including the tunnel roomId
      client.data.user = {
        id: account.id,
        role: account.role.value,
        client: clientId,
      };

      return account;
    } catch (error) {
      const reason =
        error instanceof DomainException ? error.key : 'Unauthorized';
      return this.handleFailure(client, mode, reason);
    }
  }

  /**
   * Internal handler for verification failures.
   */
  private handleFailure(
    client: Socket,
    mode: 'public' | 'private',
    reason: string,
  ): null {
    if (mode === 'private') {
      this.logger.warn(`Client ${client.id} rejected: ${reason}`);
      WebsocketRelay.disconnect(client, reason);
    } else {
      this.logger.log(`Client ${client.id} public access: ${reason}`);
      client.data.user = null;
    }
    return null;
  }
}
