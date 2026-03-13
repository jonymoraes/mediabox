import { QuotaUsage } from '@/src/domain/identity/value-objects/quota-usage.vo';

export class QuotaUsageFactory {
  /**
   * Creates a QuotaUsage instance for testing.
   * Mirrors the domain VO static create method.
   */
  public static create(
    transferredBytes: bigint = BigInt(0),
    totalRequests: number = 0,
    lastResetAt: Date | string = new Date(),
  ): QuotaUsage {
    return QuotaUsage.create(transferredBytes, totalRequests, lastResetAt);
  }

  /**
   * Creates a QuotaUsage with custom values using an object (helper).
   */
  public static load(
    props: {
      transferredBytes?: bigint;
      totalRequests?: number;
      lastResetAt?: Date;
    } = {},
  ): QuotaUsage {
    return QuotaUsage.create(
      props.transferredBytes ?? BigInt(0),
      props.totalRequests ?? 0,
      props.lastResetAt ?? new Date(),
    );
  }
}
