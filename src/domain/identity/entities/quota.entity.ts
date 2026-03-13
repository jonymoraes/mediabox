import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';
import { HttpStatus } from '@nestjs/common';
import { QuotaUsage } from '../value-objects/quota-usage.vo';

export interface QuotaProps {
  id: string;
  accountId: string;
  usage: QuotaUsage;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Quota {
  private readonly _id: string;
  private readonly _accountId: string;
  private _usage: QuotaUsage;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(props: QuotaProps) {
    this._id = props.id;
    this._accountId = props.accountId;
    this._usage = props.usage;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: { accountId: string }): Quota {
    return new Quota({
      id: '',
      accountId: props.accountId,
      usage: QuotaUsage.create(BigInt(0), 0, new Date()),
    });
  }

  public static load(props: QuotaProps): Quota {
    return new Quota(props);
  }

  get id(): string {
    return this._id;
  }
  get accountId(): string {
    return this._accountId;
  }
  get usage(): QuotaUsage {
    return this._usage;
  }
  get createdAt(): Date | undefined {
    return this._createdAt;
  }
  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  // Getters delegados para acceso rápido
  get transferredBytes(): bigint {
    return this._usage.transferredBytes;
  }
  get totalRequests(): number {
    return this._usage.totalRequests;
  }
  get lastResetAt(): Date {
    return this._usage.lastResetAt;
  }

  public addTransfer(sizeInBytes: bigint): void {
    if (sizeInBytes < BigInt(0)) {
      throw new DomainException(
        'identity.quota.errors.invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
    this._usage = this._usage.add(sizeInBytes);
  }

  public reset(): void {
    this._usage = QuotaUsage.create(BigInt(0), 0, new Date());
  }

  public unpack(): QuotaProps {
    return {
      id: this._id,
      accountId: this._accountId,
      usage: this._usage,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
