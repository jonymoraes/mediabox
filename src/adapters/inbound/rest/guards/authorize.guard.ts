import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Domain
import { RoleType } from '@/src/domain/identity/value-objects/role.vo';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Interfaces
import { SessionRequest } from '../interfaces/auth.interface';

// Exceptions
import {
  InvalidTokenException,
  NotAuthorizedException,
} from '@/src/domain/identity/exceptions/account.exceptions';

@Injectable()
export class AuthorizeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accountPort: AccountPort,
  ) {}

  /**
   * Validates if the authenticated user has the necessary permissions.
   * Execution requires AuthenticateGuard to have run previously.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<SessionRequest>();

    if (!req.user) {
      throw new InvalidTokenException();
    }

    // Retrieve roles from metadata using the exact key 'roles' defined in the decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    // Grant access if no specific roles are required for this route
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const account = await this.accountPort.findById(req.user.sub);

    if (!account || !account.id) {
      throw new InvalidTokenException();
    }

    // Check if the account's role matches any of the required roles
    const hasRole = requiredRoles.some((role) => account.role.value === role);

    if (!hasRole) {
      throw new NotAuthorizedException();
    }

    // Update request user with fresh domain data
    req.user = {
      sub: account.id,
      role: account.role,
    };

    return true;
  }
}
