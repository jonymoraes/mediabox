import {
  MediaStatus,
  MediaStatusType,
} from '@/src/domain/media/value-objects/media-status.vo';

export class MediaStatusFactory {
  /**
   * Returns a TEMPORARY status instance.
   */
  public static temporary(): MediaStatus {
    return MediaStatus.temporary();
  }

  /**
   * Returns an ACTIVE status instance.
   */
  public static active(): MediaStatus {
    return MediaStatus.active();
  }

  /**
   * Creates a MediaStatus from a string value.
   * Useful for data coming from external sources or DB.
   */
  public static fromString(value: string): MediaStatus {
    return MediaStatus.fromString(value);
  }

  /**
   * Returns a random status for testing variations.
   */
  public static random(): MediaStatus {
    const statuses = [MediaStatusType.TEMPORARY, MediaStatusType.ACTIVE];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    return MediaStatus.fromString(randomStatus);
  }
}
