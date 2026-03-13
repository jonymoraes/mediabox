import { HttpStatus } from '@nestjs/common';
import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';

export enum OptimizationStatusType {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  FAILED = 'failed',
}

export class OptimizationStatus {
  private constructor(private readonly value: OptimizationStatusType) {}

  public static fromString(value: string): OptimizationStatus {
    const status = Object.values(OptimizationStatusType).find(
      (v) => (v as string) === value,
    );

    if (!status) {
      throw new DomainException(
        'media.status.errors.invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new OptimizationStatus(status);
  }

  public getValue(): OptimizationStatusType {
    return this.value;
  }

  public isFinalized(): boolean {
    return [
      OptimizationStatusType.COMPLETED,
      OptimizationStatusType.CANCELED,
      OptimizationStatusType.FAILED,
    ].includes(this.value);
  }

  public isCanceled(): boolean {
    return this.value === OptimizationStatusType.CANCELED;
  }
}
