import { Quota } from '@/src/domain/identity/entities/quota.entity';

export abstract class QuotaPort {
  abstract findById(id: string): Promise<Quota | null>;
  /**
   * Finds a quota by the account unique identifier.
   */
  abstract findByAccountId(accountId: string): Promise<Quota | null>;

  /**
   * Persists or updates a quota entity (create or update).
   */
  abstract save(quota: Quota): Promise<Quota>;

  /**
   * Removes a quota from the system by accountId.
   */
  abstract delete(accountId: string): Promise<boolean>;
}
