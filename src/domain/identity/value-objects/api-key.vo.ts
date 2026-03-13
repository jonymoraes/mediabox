import { randomBytes } from 'crypto';
import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';
import { HttpStatus } from '@nestjs/common';
import { ApiKeyStatus } from './api-key-status.vo';

export class ApiKey {
  private readonly _value: string;
  private readonly _status: ApiKeyStatus;

  private constructor(value: string, status: ApiKeyStatus) {
    this._value = value;
    this._status = status;
  }

  /**
   * Creates an ApiKey instance from an existing value and status.
   * @param value The raw API key string (hex 64 chars).
   * @param status The ApiKeyStatus value object.
   * @throws DomainException if the value format is invalid.
   */
  public static create(
    value: string,
    status: ApiKeyStatus = ApiKeyStatus.active(),
  ): ApiKey {
    if (!value || value.length !== 64) {
      throw new DomainException(
        'identity.auth.errors.invalid_apikey_format',
        HttpStatus.BAD_REQUEST,
      );
    }
    return new ApiKey(value, status);
  }

  /**
   * Generates a new cryptographically secure API key with active status.
   * Uses 256 bits of entropy (32 bytes).
   * @returns A new ApiKey instance.
   */
  public static generate(): ApiKey {
    const hex = randomBytes(32).toString('hex');
    return new ApiKey(hex, ApiKeyStatus.active());
  }

  /**
   * Returns a new instance with the updated status.
   * Value Objects are immutable, so we return a new one.
   */
  public withStatus(newStatus: ApiKeyStatus): ApiKey {
    return new ApiKey(this._value, newStatus);
  }

  /**
   * Checks if the API key is currently active.
   */
  public isActive(): boolean {
    return this._status.isActive();
  }

  public get value(): string {
    return this._value;
  }

  public get status(): ApiKeyStatus {
    return this._status;
  }

  public toString(): string {
    return this._value;
  }
}
