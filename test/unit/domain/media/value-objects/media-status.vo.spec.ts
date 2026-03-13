import {
  MediaStatus,
  MediaStatusType,
} from '@/src/domain/media/value-objects/media-status.vo';
import { expectDomainException } from '../../shared/exceptions/expect-domain-exception';

describe('MediaStatus Value Object', () => {
  it('should create a temporary status using static method', () => {
    const status = MediaStatus.temporary();
    expect(status.value).toBe(MediaStatusType.TEMPORARY);
    expect(status.isTemporary()).toBe(true);
    expect(status.isActive()).toBe(false);
  });

  it('should create an active status using static method', () => {
    const status = MediaStatus.active();
    expect(status.value).toBe(MediaStatusType.ACTIVE);
    expect(status.isActive()).toBe(true);
    expect(status.isTemporary()).toBe(false);
  });

  it('should create from a valid string', () => {
    const status = MediaStatus.fromString('temporary');
    expect(status.value).toBe(MediaStatusType.TEMPORARY);
  });

  it('should be case insensitive when creating from string', () => {
    const status = MediaStatus.fromString('ACTIVE');
    expect(status.value).toBe(MediaStatusType.ACTIVE);
  });

  it('should fail when creating from an invalid string', () => {
    expectDomainException(
      () => MediaStatus.fromString('unknown_status'),
      'media.status.errors.invalid',
    );
  });

  it('should identify equal statuses', () => {
    const status1 = MediaStatus.active();
    const status2 = MediaStatus.fromString('active');
    const status3 = MediaStatus.temporary();

    expect(status1.equals(status2)).toBe(true);
    expect(status1.equals(status3)).toBe(false);
  });

  it('should return string representation of the value', () => {
    const status = MediaStatus.active();
    expect(status.toString()).toBe(MediaStatusType.ACTIVE);
  });
});
