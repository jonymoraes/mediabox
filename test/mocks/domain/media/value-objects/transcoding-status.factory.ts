import {
  TranscodingStatus,
  TranscodingStatusType,
} from '@/src/domain/media/value-objects/transcoding-status.vo';

export class TranscodingStatusFactory {
  /**
   * Returns a PENDING transcoding status.
   */
  public static pending(): TranscodingStatus {
    return TranscodingStatus.fromString(TranscodingStatusType.PENDING);
  }

  /**
   * Returns a PROCESSING transcoding status.
   */
  public static processing(): TranscodingStatus {
    return TranscodingStatus.fromString(TranscodingStatusType.PROCESSING);
  }

  /**
   * Returns a COMPLETED transcoding status.
   */
  public static completed(): TranscodingStatus {
    return TranscodingStatus.fromString(TranscodingStatusType.COMPLETED);
  }

  /**
   * Returns a FAILED transcoding status.
   */
  public static failed(): TranscodingStatus {
    return TranscodingStatus.fromString(TranscodingStatusType.FAILED);
  }

  /**
   * Creates a TranscodingStatus from a raw string value.
   */
  public static fromString(value: string): TranscodingStatus {
    return TranscodingStatus.fromString(value);
  }

  /**
   * Returns a random transcoding status for variation testing.
   */
  public static random(): TranscodingStatus {
    const values = Object.values(TranscodingStatusType);
    const randomValue = values[Math.floor(Math.random() * values.length)];
    return TranscodingStatus.fromString(randomValue);
  }
}
