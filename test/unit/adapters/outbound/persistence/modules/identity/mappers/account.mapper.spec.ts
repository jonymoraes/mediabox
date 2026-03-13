import { AccountMapper } from '@/src/adapters/outbound/persistence/modules/identity/mappers/account.mapper';
import { Account as AccountOrm } from '@/src/adapters/outbound/persistence/modules/identity/entities/account.entity-orm';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { RoleType } from '@/src/domain/identity/value-objects/role.vo';
import { ApiKeyStatusType } from '@/src/domain/identity/value-objects/api-key-status.vo';

describe('AccountMapper', () => {
  const now = new Date();
  const accountId = '567305b3-760e-4973-afd5-2b04127eabc7';
  const validApiKey = 'a'.repeat(64);

  // Base ORM account without quotas to trigger falsy branches
  const mockOrmAccount: AccountOrm = {
    id: accountId,
    apikey: validApiKey,
    status: ApiKeyStatusType.ACTIVE as any,
    role: RoleType.USER as any,
    name: 'Test Account',
    domain: 'test.com',
    folder: 'test.com',
    storagePath: 'public/test.com',
    usedBytes: '1024',
    createdAt: now,
    updatedAt: now,
  };

  describe('toDomain', () => {
    it('should map an ORM account to a Domain entity (without quotas, Line 31 falsy branch)', () => {
      const ormNoQuotas = { ...mockOrmAccount, quotas: undefined };
      const domain = AccountMapper.toDomain(ormNoQuotas);

      expect(domain.unpack().quotas).toEqual([]);
    });

    it('should map an ORM account to a Domain entity (with quotas, Line 31 truthy branch)', () => {
      const ormWithQuotas = {
        ...mockOrmAccount,
        quotas: [{ resource: 'storage', limit: '100', used: '0' } as any],
      };
      const domain = AccountMapper.toDomain(ormWithQuotas);

      expect(domain.unpack().quotas!.length).toBe(1);
    });

    it('should handle plain objects and string types for status/role and undefined usedBytes (hydration fallback branches)', () => {
      const ormFromInfra = {
        ...mockOrmAccount,
        status: { value: ApiKeyStatusType.EXPIRED },
        role: { _value: RoleType.ADMIN }, // Hits the || fallback for role
        usedBytes: undefined, // Hits the || 0 fallback for usedBytes
      } as unknown as AccountOrm;

      const domain = AccountMapper.toDomain(ormFromInfra);
      const props = domain.unpack();

      expect(props.apikey.status.value).toBe(ApiKeyStatusType.EXPIRED);
      expect(props.role.value).toBe(RoleType.ADMIN);
      expect(props.usedBytes).toBe(BigInt(0));
    });
  });

  describe('toPersistence', () => {
    it('should map a Domain entity to an ORM partial (with quotas, Line 60 truthy branch)', () => {
      const domain = AccountFactory.load({
        id: accountId,
        name: 'Domain Name',
        usedBytes: BigInt(2048),
        quotas: [
          { resource: 'storage', limit: BigInt(100), used: BigInt(0) },
        ] as any,
      });

      const orm = AccountMapper.toPersistence(domain);

      expect(orm.id).toBe(accountId);
      expect(orm.usedBytes).toBe('2048');
      expect((orm as any).quota).toBeDefined();
    });

    it('should omit quota key if quotas is null in domain (Line 60 falsy branch)', () => {
      const domain = AccountFactory.load({ id: accountId });

      // Force null to bypass the truthy evaluation of empty arrays []
      domain.unpack = jest.fn().mockReturnValue({
        ...AccountFactory.load({ id: accountId }).unpack(),
        quotas: null,
      });

      const orm = AccountMapper.toPersistence(domain);

      expect((orm as any).quota).toBeUndefined();
    });

    it('should not include id in persistence if domain id is empty', () => {
      const domain = AccountFactory.create({ name: 'New' });
      Object.defineProperty(domain, 'id', { value: '' });

      const orm = AccountMapper.toPersistence(domain);

      expect(orm.id).toBeUndefined();
    });

    it('should map optional fields to undefined if they are null in domain', () => {
      const domain = AccountFactory.load({
        domain: null as any,
        folder: null as any,
        storagePath: null as any,
      });

      const orm = AccountMapper.toPersistence(domain);

      expect(orm.domain).toBeUndefined();
      expect(orm.folder).toBeUndefined();
      expect(orm.storagePath).toBeUndefined();
    });
  });
});
