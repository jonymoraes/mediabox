import {
  ApiKeyStatus,
  ApiKeyStatusType,
} from '@/src/domain/identity/value-objects/api-key-status.vo';
import { expectDomainException } from '../../shared/exceptions/expect-domain-exception';

describe('ApiKeyStatus Value Object', () => {
  it('should create an active status using static method', () => {
    const status = ApiKeyStatus.active();
    expect(status.value).toBe(ApiKeyStatusType.ACTIVE);
    expect(status.isActive()).toBe(true);
  });

  it('should create an inactive status using static method', () => {
    const status = ApiKeyStatus.inactive();
    expect(status.value).toBe(ApiKeyStatusType.INACTIVE);
    expect(status.isInactive()).toBe(true);
  });

  it('should create an expired status using static method', () => {
    const status = ApiKeyStatus.expired();
    expect(status.value).toBe(ApiKeyStatusType.EXPIRED);
    expect(status.isExpired()).toBe(true);
  });

  it('should create from a valid string', () => {
    const status = ApiKeyStatus.fromString('active');
    expect(status.value).toBe(ApiKeyStatusType.ACTIVE);
  });

  it('should be case insensitive when creating from string', () => {
    const status = ApiKeyStatus.fromString('EXPIRED');
    expect(status.value).toBe(ApiKeyStatusType.EXPIRED);
  });

  it('should fail when creating from an invalid string', () => {
    expectDomainException(
      () => ApiKeyStatus.fromString('deleted'),
      'identity.auth.errors.invalid_status',
    );
  });

  it('should identify equal statuses', () => {
    const status1 = ApiKeyStatus.active();
    const status2 = ApiKeyStatus.fromString('active');
    const status3 = ApiKeyStatus.inactive();

    expect(status1.equals(status2)).toBe(true);
    expect(status1.equals(status3)).toBe(false);
  });

  it('should return string representation', () => {
    const status = ApiKeyStatus.expired();
    expect(status.toString()).toBe('expired');
  });
});
