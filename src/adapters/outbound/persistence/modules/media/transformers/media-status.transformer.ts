import { ValueTransformer } from 'typeorm';
import { MediaStatus } from '@/src/domain/media/value-objects/media-status.vo';

export class MediaStatusTransformer implements ValueTransformer {
  /**
   * Persists the primitive value to the database.
   */
  to(status: MediaStatus | undefined): string | undefined {
    return status?.value;
  }

  /**
   * Rehydrates the Value Object when reading from the database.
   */
  from(value: string | undefined): MediaStatus | undefined {
    if (!value) return undefined;
    return MediaStatus.fromString(value);
  }
}
