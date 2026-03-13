export interface QuotaUsageProps {
  transferredBytes: bigint;
  totalRequests: number;
  lastResetAt: Date;
}

export class QuotaUsage {
  private readonly _transferredBytes: bigint;
  private readonly _totalRequests: number;
  private readonly _lastResetAt: Date;

  private constructor(props: QuotaUsageProps) {
    const now = new Date();

    const lastReset =
      props.lastResetAt instanceof Date
        ? props.lastResetAt
        : new Date(props.lastResetAt);

    const isNewPeriod =
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();

    if (isNewPeriod) {
      this._transferredBytes = BigInt(0);
      this._totalRequests = 0;
      this._lastResetAt = now;
    } else {
      this._transferredBytes = props.transferredBytes;
      this._totalRequests = props.totalRequests;
      this._lastResetAt = lastReset;
    }
  }

  /**
   * Creates a QuotaUsage instance.
   * lastResetAt can be Date or string (for hydration from Redis/JSON).
   */
  public static create(
    transferredBytes: bigint,
    totalRequests: number,
    lastResetAt: Date | string,
  ): QuotaUsage {
    const date =
      typeof lastResetAt === 'string' ? new Date(lastResetAt) : lastResetAt;
    return new QuotaUsage({
      transferredBytes,
      totalRequests,
      lastResetAt: date,
    });
  }

  public add(bytes: bigint): QuotaUsage {
    return new QuotaUsage({
      transferredBytes: this._transferredBytes + bytes,
      totalRequests: this._totalRequests + 1,
      lastResetAt: this._lastResetAt,
    });
  }

  get transferredBytes(): bigint {
    return this._transferredBytes;
  }

  get totalRequests(): number {
    return this._totalRequests;
  }

  get lastResetAt(): Date {
    return this._lastResetAt;
  }
}
