import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';
import { HttpStatus } from '@nestjs/common';

export enum MediaStatusType {
  TEMPORARY = 'temporary',
  ACTIVE = 'active',
}

export class MediaStatus {
  private constructor(public readonly value: MediaStatusType) {}

  public static fromString(value: string): MediaStatus {
    const found = Object.values(MediaStatusType).find(
      (v) => v.toLowerCase() === value.toLowerCase(),
    );

    if (!found) {
      throw new DomainException(
        'media.status.errors.invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new MediaStatus(found as MediaStatusType);
  }

  public static temporary(): MediaStatus {
    return new MediaStatus(MediaStatusType.TEMPORARY);
  }

  public static active(): MediaStatus {
    return new MediaStatus(MediaStatusType.ACTIVE);
  }

  public isTemporary(): boolean {
    return this.value === MediaStatusType.TEMPORARY;
  }

  public isActive(): boolean {
    return this.value === MediaStatusType.ACTIVE;
  }

  public equals(other: MediaStatus): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
