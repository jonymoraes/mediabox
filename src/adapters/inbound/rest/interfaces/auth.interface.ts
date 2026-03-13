import { FastifyRequest } from 'fastify';
import { Role, RoleType } from '@/src/domain/identity/value-objects/role.vo';

export interface Session {
  sub: string;
  role: RoleType;
}

export interface SessionRequest extends FastifyRequest {
  user?: {
    sub: string;
    role: Role;
  };
  token?: string;
}
