import { HttpStatus } from '@nestjs/common';
import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';

export enum RoleType {
  ADMIN = 'Admin',
  USER = 'User',
}

export class Role {
  private readonly _value: RoleType;

  private constructor(value: RoleType) {
    this._value = value;
  }

  public static admin(): Role {
    return new Role(RoleType.ADMIN);
  }

  public static user(): Role {
    return new Role(RoleType.USER);
  }

  public static fromString(value: any): Role {
    if (value instanceof Role) return value;

    const rawValue =
      value && typeof value === 'object' ? value._value || value.value : value;

    if (
      !rawValue ||
      typeof rawValue !== 'string' ||
      rawValue.trim().length === 0
    ) {
      throw new DomainException(
        'identity.auth.errors.invalid_role',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const cleanValue = rawValue.trim().toLowerCase();
    const found = Object.values(RoleType).find(
      (v) => v.toLowerCase() === cleanValue,
    );

    if (!found) {
      throw new DomainException(
        'identity.auth.errors.invalid_role',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return new Role(found as RoleType);
  }

  public equals(other: Role): boolean {
    if (!(other instanceof Role)) return false;
    return this._value === other.value;
  }

  public isAdmin(): boolean {
    return this._value === RoleType.ADMIN;
  }

  public get value(): RoleType {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }
}
