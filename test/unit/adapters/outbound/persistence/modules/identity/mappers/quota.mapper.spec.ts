import { QuotaMapper } from '@/src/adapters/outbound/persistence/modules/identity/mappers/quota.mapper';
import { Quota as QuotaOrm } from '@/src/adapters/outbound/persistence/modules/identity/entities/quota.entity-orm';
import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';
import { QuotaUsageFactory } from '@/test/mocks/domain/identity/value-objects/quota-usage.factory';

describe('QuotaMapper', () => {
  const now = new Date();
  const quotaId = 'q-123';
  const accountId = 'a-456';

  const mockOrmQuota: QuotaOrm = {
    id: quotaId,
    accountId: accountId,
    transferredBytes: '5000000',
    totalRequests: 150,
    lastResetAt: now,
    createdAt: now,
    updatedAt: now,
  };

  describe('toDomain', () => {
    it('should map an ORM quota to a Domain entity', () => {
      const domain = QuotaMapper.toDomain(mockOrmQuota);
      const props = domain.unpack();

      expect(domain.id).toBe(quotaId);
      expect(props.accountId).toBe(accountId);
      expect(props.usage.transferredBytes).toBe(BigInt(5000000));
      expect(props.usage.totalRequests).toBe(150);
      expect(props.usage.lastResetAt).toEqual(now);
    });

    it('should handle hydration with string dates (Redis compatibility)', () => {
      const redisData = {
        ...mockOrmQuota,
        transferredBytes: '7000',
        lastResetAt: now.toISOString(),
      } as unknown as QuotaOrm;

      const domain = QuotaMapper.toDomain(redisData);
      const props = domain.unpack();

      expect(props.usage.transferredBytes).toBe(BigInt(7000));
      expect(props.usage.lastResetAt).toBeInstanceOf(Date);
      expect(props.usage.lastResetAt.getTime()).toBe(now.getTime());
    });
  });

  describe('toPersistence', () => {
    it('should map a Domain entity to an ORM partial by extracting usage data', () => {
      const domain = QuotaFactory.load({
        id: quotaId,
        accountId: accountId,
        usage: QuotaUsageFactory.create(BigInt(999), 10, now),
      });

      const orm = QuotaMapper.toPersistence(domain);

      expect(orm.id).toBe(quotaId);
      expect(orm.accountId).toBe(accountId);
      expect(orm.transferredBytes).toBe('999');
      expect(orm.totalRequests).toBe(10);
      expect(orm.lastResetAt).toEqual(now);
    });

    it('should maintain id as undefined if not present in domain', () => {
      const domain = QuotaFactory.create({ accountId });

      const orm = QuotaMapper.toPersistence(domain);

      expect(orm.id).toBeUndefined();
      expect(orm.accountId).toBe(accountId);
    });
  });
});
