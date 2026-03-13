import { HttpStatus } from '@nestjs/common';
import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';

export enum TranscodingStatusType {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  FAILED = 'failed',
}

export class TranscodingStatus {
  private constructor(private readonly value: TranscodingStatusType) {}

  public static fromString(value: string): TranscodingStatus {
    const status = Object.values(TranscodingStatusType).find(
      (v) => (v as string).toLowerCase() === value.toLowerCase(),
    );

    if (!status) {
      throw new DomainException(
        'media.status.errors.invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new TranscodingStatus(status as TranscodingStatusType);
  }

  public getValue(): TranscodingStatusType {
    return this.value;
  }

  public isFinalized(): boolean {
    return [
      TranscodingStatusType.COMPLETED,
      TranscodingStatusType.CANCELED,
      TranscodingStatusType.FAILED,
    ].includes(this.value);
  }

  public isCanceled(): boolean {
    return this.value === TranscodingStatusType.CANCELED;
  }
}
