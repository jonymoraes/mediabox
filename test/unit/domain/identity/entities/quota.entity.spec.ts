import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';
import { expectDomainException } from '../../shared/exceptions/expect-domain-exception';

describe('Quota Entity', () => {
  it('should create a new quota with zero usage', () => {
    const accountId = 'acc-123';
    const quota = QuotaFactory.create({ accountId });

    expect(quota.accountId).toBe(accountId);
    expect(quota.transferredBytes).toBe(BigInt(0));
    expect(quota.totalRequests).toBe(0);
    expect(quota.lastResetAt).toBeInstanceOf(Date);
  });

  it('should add transfer and increment request count', () => {
    const quota = QuotaFactory.create();
    const bytesToAdd = BigInt(1024);

    quota.addTransfer(bytesToAdd);

    expect(quota.transferredBytes).toBe(bytesToAdd);
    expect(quota.totalRequests).toBe(1);
  });

  it('should accumulate multiple transfers', () => {
    const quota = QuotaFactory.create();

    quota.addTransfer(BigInt(1000));
    quota.addTransfer(BigInt(2000));

    expect(quota.transferredBytes).toBe(BigInt(3000));
    expect(quota.totalRequests).toBe(2);
  });

  it('should fail when adding negative transfer bytes', () => {
    const quota = QuotaFactory.create();

    expectDomainException(
      () => quota.addTransfer(BigInt(-1)),
      'identity.quota.errors.invalid',
    );
  });

  it('should reset usage to zero', () => {
    // Corregido: ahora el factory tiene este método
    const quota = QuotaFactory.withHighUsage('acc-123');

    quota.reset();

    expect(quota.transferredBytes).toBe(BigInt(0));
    expect(quota.totalRequests).toBe(0);

    const now = new Date();
    expect(quota.lastResetAt.getMonth()).toBe(now.getMonth());
    expect(quota.lastResetAt.getFullYear()).toBe(now.getFullYear());
  });

  it('should load quota from existing props', () => {
    const quota = QuotaFactory.load({
      id: 'q-999',
      accountId: 'acc-999',
    });

    expect(quota.id).toBe('q-999');
    expect(quota.accountId).toBe('acc-999');
  });

  it('should unpack data correctly for persistence', () => {
    const quota = QuotaFactory.load();
    const data = quota.unpack();

    expect(data.id).toBeDefined();
    expect(data.accountId).toBeDefined();
    expect(data.usage).toBeDefined();
  });
});
