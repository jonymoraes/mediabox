import { ApiKey } from '@/src/domain/identity/value-objects/api-key.vo';
import { ApiKeyStatus } from '@/src/domain/identity/value-objects/api-key-status.vo';

export class ApiKeyFactory {
  /**
   * Generates a random, active ApiKey.
   */
  public static random(): ApiKey {
    return ApiKey.generate();
  }

  /**
   * Creates an ApiKey with a fixed value for testing consistency.
   * Default is a 64-character hex string of 'a'.
   */
  public static createDeterministic(
    value: string = 'a'.repeat(64),
    status: ApiKeyStatus = ApiKeyStatus.active(),
  ): ApiKey {
    return ApiKey.create(value, status);
  }

  /**
   * Generates an ApiKey explicitly set to Inactive status.
   */
  public static inactive(): ApiKey {
    return ApiKey.generate().withStatus(ApiKeyStatus.inactive());
  }

  /**
   * Generates an ApiKey explicitly set to Expired status.
   */
  public static expired(): ApiKey {
    return ApiKey.generate().withStatus(ApiKeyStatus.expired());
  }

  /**
   * Returns a valid 64-character hex string without instantiating the VO.
   */
  public static validRawValue(): string {
    return 'b'.repeat(64);
  }
}
