import { QuotaUsage } from '@/src/domain/identity/value-objects/quota-usage.vo';

describe('QuotaUsage Value Object', () => {
  const now = new Date();

  it('should create a quota usage instance for the current period', () => {
    const bytes = BigInt(1024);
    const requests = 5;
    const usage = QuotaUsage.create(bytes, requests, now);

    expect(usage.transferredBytes).toBe(bytes);
    expect(usage.totalRequests).toBe(requests);
    expect(usage.lastResetAt).toBe(now);
  });

  it('should reset values if the last reset was in a previous month', () => {
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const usage = QuotaUsage.create(BigInt(5000), 10, lastMonth);

    expect(usage.transferredBytes).toBe(BigInt(0));
    expect(usage.totalRequests).toBe(0);
    expect(usage.lastResetAt.getMonth()).toBe(now.getMonth());
  });

  it('should reset values if the last reset was in a previous year', () => {
    const lastYear = new Date();
    lastYear.setFullYear(now.getFullYear() - 1);

    const usage = QuotaUsage.create(BigInt(10000), 50, lastYear);

    expect(usage.transferredBytes).toBe(BigInt(0));
    expect(usage.totalRequests).toBe(0);
    expect(usage.lastResetAt.getFullYear()).toBe(now.getFullYear());
  });

  it('should increment bytes and requests correctly when adding transfer', () => {
    const initialUsage = QuotaUsage.create(BigInt(100), 1, now);
    const addedBytes = BigInt(50);

    const newUsage = initialUsage.add(addedBytes);

    expect(newUsage.transferredBytes).toBe(BigInt(150));
    expect(newUsage.totalRequests).toBe(2);
    expect(newUsage.lastResetAt).toBe(now);
  });

  it('should return a new instance when adding transfer (immutability)', () => {
    const usage = QuotaUsage.create(BigInt(100), 1, now);
    const newUsage = usage.add(BigInt(50));

    expect(usage).not.toBe(newUsage);
    expect(usage.transferredBytes).toBe(BigInt(100));
  });
});
