import { ApiKey } from '@/src/domain/identity/value-objects/api-key.vo';
import { ApiKeyStatus } from '@/src/domain/identity/value-objects/api-key-status.vo';
import { expectDomainException } from '../../shared/exceptions/expect-domain-exception';

describe('ApiKey Value Object', () => {
  const validHex = 'a'.repeat(64);

  it('should generate a valid cryptographically secure hex string', () => {
    const apiKey = ApiKey.generate();

    expect(apiKey.value).toHaveLength(64);
    expect(apiKey.value).toMatch(/^[0-9a-f]{64}$/);
    expect(apiKey.isActive()).toBe(true);
  });

  it('should create an instance from a valid existing hex string', () => {
    const apiKey = ApiKey.create(validHex);

    expect(apiKey.value).toBe(validHex);
    expect(apiKey.status.isActive()).toBe(true);
  });

  it('should fail when creating from an invalid hex string length', () => {
    expectDomainException(
      () => ApiKey.create('too-short'),
      'identity.auth.errors.invalid_apikey_format',
    );
  });

  it('should fail when creating from an empty string', () => {
    expectDomainException(
      () => ApiKey.create(''),
      'identity.auth.errors.invalid_apikey_format',
    );
  });

  it('should return a new instance with updated status (immutability)', () => {
    const apiKey = ApiKey.generate();
    const inactiveStatus = ApiKeyStatus.inactive();

    const updatedApiKey = apiKey.withStatus(inactiveStatus);

    expect(updatedApiKey).not.toBe(apiKey);
    expect(updatedApiKey.status.isInactive()).toBe(true);
    expect(apiKey.status.isActive()).toBe(true);
    expect(updatedApiKey.value).toBe(apiKey.value);
  });

  it('should correctly identify active status', () => {
    const activeKey = ApiKey.create(validHex, ApiKeyStatus.active());
    const inactiveKey = ApiKey.create(validHex, ApiKeyStatus.inactive());

    expect(activeKey.isActive()).toBe(true);
    expect(inactiveKey.isActive()).toBe(false);
  });

  it('should return the raw value when calling toString', () => {
    const apiKey = ApiKey.create(validHex);
    expect(apiKey.toString()).toBe(validHex);
  });
});
