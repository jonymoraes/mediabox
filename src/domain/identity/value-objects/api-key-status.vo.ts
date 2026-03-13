import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';
import { HttpStatus } from '@nestjs/common';

export enum ApiKeyStatusType {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export class ApiKeyStatus {
  private constructor(public readonly value: ApiKeyStatusType) {}

  /**
   * Domain factory. Expects a valid string or instance.
   */
  public static fromString(value: any): ApiKeyStatus {
    if (value instanceof ApiKeyStatus) return value;

    if (!value || typeof value !== 'string') {
      throw new DomainException(
        'identity.auth.errors.invalid_status',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cleanValue = value.trim().toLowerCase();
    const found = Object.values(ApiKeyStatusType).find(
      (v) => v.toLowerCase() === cleanValue,
    );

    if (!found) {
      throw new DomainException(
        'identity.auth.errors.invalid_status',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new ApiKeyStatus(found as ApiKeyStatusType);
  }

  public static active(): ApiKeyStatus {
    return new ApiKeyStatus(ApiKeyStatusType.ACTIVE);
  }

  public static inactive(): ApiKeyStatus {
    return new ApiKeyStatus(ApiKeyStatusType.INACTIVE);
  }

  public static expired(): ApiKeyStatus {
    return new ApiKeyStatus(ApiKeyStatusType.EXPIRED);
  }

  public isActive(): boolean {
    return this.value === ApiKeyStatusType.ACTIVE;
  }

  public isInactive(): boolean {
    return this.value === ApiKeyStatusType.INACTIVE;
  }

  public isExpired(): boolean {
    return this.value === ApiKeyStatusType.EXPIRED;
  }

  public equals(other: ApiKeyStatus): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
