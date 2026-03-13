import { Translation } from 'src/platform/shared/types/translation.type';

/**
 * Base exception for the Domain layer.
 * Captured by the infrastructure layer to provide translated responses.
 */
export class DomainException extends Error {
  constructor(
    public readonly key: Translation,
    public readonly status: number = 400,
  ) {
    super(key);
    this.name = 'DomainException';
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}
