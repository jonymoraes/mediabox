import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionRequest } from '../interfaces/auth.interface';
import { Role } from '@/src/domain/identity/value-objects/role.vo';

/**
 * Custom parameter decorator to inject the currently authenticated user
 */
export const User = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): { sub: string; role: Role } | undefined => {
    const req = context.switchToHttp().getRequest<SessionRequest>();
    return req.user;
  },
);
