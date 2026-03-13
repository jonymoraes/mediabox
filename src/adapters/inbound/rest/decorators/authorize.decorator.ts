import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@/src/domain/identity/value-objects/role.vo';

export const Authorize = (...roles: RoleType[]) => SetMetadata('roles', roles);
