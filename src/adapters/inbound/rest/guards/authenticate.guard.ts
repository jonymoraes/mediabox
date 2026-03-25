import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// Outbound Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Interfaces
import { SessionRequest } from '../interfaces/auth.interface';

// Exceptions
import { DomainException } from '@/src/domain/shared/exceptions/domain.exceptions';
import {
  InvalidTokenException,
  NotAuthorizedException,
} from '@/src/domain/identity/exceptions/account.exceptions';

@Injectable()
export class AuthenticateGuard implements CanActivate {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
  ) {}

  /**
   * Validates the API key from headers and attaches account data to the request.
   * @param context - Execution context
   * @returns Promise<boolean>
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<SessionRequest>();
    const apiKey = req.headers['x-media-key'] as string | undefined;
    const client = req.headers['x-media-client'] as string | undefined;

    if (!apiKey) throw new InvalidTokenException();
    if (!client) throw new InvalidTokenException();

    try {
      const account = await this.accountPort.findByApiKey(apiKey);
      if (!account) throw new InvalidTokenException();

      // Ensure we use the primitive ID string for external operations
      const accountId = account.id.toString();

      if (!account.isActive()) throw new NotAuthorizedException();

      // Quota logic - Trigger reset or validation
      const quota = await this.quotaPort.findByAccountId(accountId);
      if (quota) {
        quota.addTransfer(0n);
        await this.quotaPort.save(quota);
      }

      if (!client) throw new NotAuthorizedException();

      // Attach session data
      req.account = {
        sub: accountId,
        role: account.role,
        client: client,
      };

      return true;
    } catch (error) {
      if (!(error instanceof DomainException)) {
        console.error('[Guard System Error]:', error);
      }

      if (error instanceof DomainException) {
        throw error;
      }

      throw new InvalidTokenException();
    }
  }
}
