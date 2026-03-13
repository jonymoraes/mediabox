import { ValueTransformer } from 'typeorm';
import { ApiKeyStatus } from '@/src/domain/identity/value-objects/api-key-status.vo';

export class ApiKeyStatusTransformer implements ValueTransformer {
  /**
   * Persists the Value Object as a primitive string.
   */
  public to(status: ApiKeyStatus | undefined): string | undefined {
    return status?.value;
  }

  public from(value: any): ApiKeyStatus | undefined {
    if (value === null || value === undefined) return undefined;

    const rawValue = value && typeof value === 'object' ? value.value : value;

    return ApiKeyStatus.fromString(rawValue);
  }
}
