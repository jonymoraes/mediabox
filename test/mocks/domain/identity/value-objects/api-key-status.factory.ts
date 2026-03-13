import {
  ApiKeyStatus,
  ApiKeyStatusType,
} from '@/src/domain/identity/value-objects/api-key-status.vo';

export class ApiKeyStatusFactory {
  /**
   * Creates an Active status instance.
   */
  public static active(): ApiKeyStatus {
    return ApiKeyStatus.active();
  }

  /**
   * Creates an Inactive status instance.
   */
  public static inactive(): ApiKeyStatus {
    return ApiKeyStatus.inactive();
  }

  /**
   * Creates an Expired status instance.
   */
  public static expired(): ApiKeyStatus {
    return ApiKeyStatus.expired();
  }

  /**
   * Generates a random ApiKeyStatus.
   */
  public static random(): ApiKeyStatus {
    const statuses = Object.values(ApiKeyStatusType);
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    return ApiKeyStatus.fromString(randomStatus);
  }

  /**
   * Creates a status from a specific string.
   */
  public static fromString(value: string): ApiKeyStatus {
    return ApiKeyStatus.fromString(value);
  }
}
