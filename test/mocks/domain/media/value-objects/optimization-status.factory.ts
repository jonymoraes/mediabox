import {
  OptimizationStatus,
  OptimizationStatusType,
} from '@/src/domain/media/value-objects/optimization-status.vo';

export class OptimizationStatusFactory {
  /**
   * Returns a PENDING optimization status.
   */
  public static pending(): OptimizationStatus {
    return OptimizationStatus.fromString(OptimizationStatusType.PENDING);
  }

  /**
   * Returns a COMPLETED optimization status.
   */
  public static completed(): OptimizationStatus {
    return OptimizationStatus.fromString(OptimizationStatusType.COMPLETED);
  }

  /**
   * Returns a FAILED optimization status.
   */
  public static failed(): OptimizationStatus {
    return OptimizationStatus.fromString(OptimizationStatusType.FAILED);
  }

  /**
   * Creates an OptimizationStatus from a raw string value.
   */
  public static fromString(value: string): OptimizationStatus {
    return OptimizationStatus.fromString(value);
  }

  /**
   * Returns a random optimization status.
   */
  public static random(): OptimizationStatus {
    const values = Object.values(OptimizationStatusType);
    const randomValue = values[Math.floor(Math.random() * values.length)];
    return OptimizationStatus.fromString(randomValue);
  }
}
