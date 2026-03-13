import { Quota as QuotaOrm } from '../entities/quota.entity-orm';
import { Quota as QuotaDomain } from '@/src/domain/identity/entities/quota.entity';
import { QuotaUsage } from '@/src/domain/identity/value-objects/quota-usage.vo';

export class QuotaMapper {
  /**
   * Maps ORM entity to Domain entity.
   */
  public static toDomain(orm: QuotaOrm): QuotaDomain {
    return QuotaDomain.load({
      id: orm.id,
      accountId: orm.accountId,
      usage: QuotaUsage.create(
        BigInt(orm.transferredBytes || 0),
        orm.totalRequests || 0,
        orm.lastResetAt,
      ),
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  /**
   * Maps Domain entity to Persistence object.
   * Extracts data from the QuotaUsage value object.
   */
  public static toPersistence(domain: QuotaDomain): Partial<QuotaOrm> {
    const data = domain.unpack();
    const usage = data.usage;

    return {
      ...(data.id && { id: data.id }),
      accountId: data.accountId,
      transferredBytes: usage.transferredBytes.toString(),
      totalRequests: usage.totalRequests,
      lastResetAt: usage.lastResetAt,
    };
  }
}
