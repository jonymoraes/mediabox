import { Quota, QuotaProps } from '@/src/domain/identity/entities/quota.entity';
import { QuotaUsageFactory } from '../value-objects/quota-usage.factory';

export class QuotaFactory {
  /**
   * Creates a Quota using domain logic.
   * If no accountId is provided, uses a default one for testing.
   */
  public static create(props?: { accountId: string }): Quota {
    return Quota.create({
      accountId: props?.accountId ?? 'acc-test-123',
    });
  }

  /**
   * Loads a full Quota instance bypassing domain rules.
   */
  public static load(partial: Partial<QuotaProps> = {}): Quota {
    const defaultProps: QuotaProps = {
      id: partial.id ?? 'q-123',
      accountId: partial.accountId ?? 'account-123',
      usage: partial.usage ?? QuotaUsageFactory.create(),
      createdAt: partial.createdAt ?? new Date(),
      updatedAt: partial.updatedAt ?? new Date(),
    };

    return Quota.load(defaultProps);
  }

  /**
   * Helper for tests that need an entity with existing usage.
   */
  public static withHighUsage(accountId: string = 'acc-test-123'): Quota {
    return this.load({
      accountId,
      usage: QuotaUsageFactory.create(BigInt(5000000), 150, new Date()),
    });
  }
}
