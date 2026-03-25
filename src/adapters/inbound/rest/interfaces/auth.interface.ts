import { FastifyRequest } from 'fastify';
import { Role, RoleType } from '@/src/domain/identity/value-objects/role.vo';

export interface Session {
  sub: string;
  role: RoleType;
  client: string;
}

export interface SessionRequest extends FastifyRequest {
  account?: {
    sub: string;
    role: Role;
    client: string;
  };
  token?: string;
  client: string;
}
