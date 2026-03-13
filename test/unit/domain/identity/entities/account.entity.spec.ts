import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { ApiKeyStatusFactory } from '@/test/mocks/domain/identity/value-objects/api-key-status.factory';
import { expectDomainException } from '../../shared/exceptions/expect-domain-exception';

describe('Account Entity', () => {
  it('should create a new account with default values', () => {
    const account = AccountFactory.create({
      name: 'Project X',
      domain: 'projectx.com',
    });

    expect(account.name).toBe('Project X');
    expect(account.domain).toBe('projectx.com');
    expect(account.usedBytes).toBe(BigInt(0));
    expect(account.isActive()).toBe(true);
    expect(account.folder).toBeDefined();
  });

  it('should fail if domain generation results in empty folder', () => {
    expectDomainException(
      () => AccountFactory.create({ domain: '' }),
      'identity.account.errors.invalid_domain',
    );
  });

  it('should change status by updating the apikey', () => {
    const account = AccountFactory.load();
    const inactiveStatus = ApiKeyStatusFactory.inactive();

    account.changeStatus(inactiveStatus);

    expect(account.isActive()).toBe(false);
    expect(account.apikey.status.isInactive()).toBe(true);
  });

  it('should update storage usage', () => {
    const account = AccountFactory.load();
    const newUsage = BigInt(1024 * 1024);

    account.updateStorageUsage(newUsage);

    expect(account.usedBytes).toBe(newUsage);
  });

  it('should fail when updating storage with negative bytes', () => {
    const account = AccountFactory.load();
    expectDomainException(
      () => account.updateStorageUsage(BigInt(-1)),
      'identity.account.storage.errors.invalid',
    );
  });

  it('should change domain and return path changes', () => {
    const account = AccountFactory.load({ domain: 'old.com' });
    const oldPath = account.storagePath;

    const paths = account.changeDomain('new.com');

    expect(account.domain).toBe('new.com');
    expect(paths.oldPath).toBe(oldPath);
    expect(paths.newPath).toContain('new.com');
  });

  it('should unpack correct properties', () => {
    const account = AccountFactory.load();
    const props = account.unpack();

    expect(props.id).toBe(account.id);
    expect(props.name).toBe(account.name);
    expect(props.role).toBe(account.role);
  });
});
