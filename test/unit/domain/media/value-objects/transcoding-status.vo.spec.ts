import { HttpStatus } from '@nestjs/common';
import {
  TranscodingStatus,
  TranscodingStatusType,
} from '@/src/domain/media/value-objects/transcoding-status.vo';
import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';

describe('TranscodingStatus', () => {
  describe('fromString', () => {
    it('should create a valid TranscodingStatus from a valid string', () => {
      const status = TranscodingStatus.fromString(
        TranscodingStatusType.PENDING,
      );

      expect(status).toBeInstanceOf(TranscodingStatus);
      expect(status.getValue()).toBe(TranscodingStatusType.PENDING);
    });

    it('should be case insensitive when creating from string', () => {
      const status = TranscodingStatus.fromString('PROCESSING');
      expect(status.getValue()).toBe(TranscodingStatusType.PROCESSING);
    });

    it('should throw a DomainException when the string is invalid', () => {
      const invalidValue = 'invalid_status';

      expect(() => {
        TranscodingStatus.fromString(invalidValue);
      }).toThrow(DomainException);

      try {
        TranscodingStatus.fromString(invalidValue);
      } catch (error) {
        const exception = error as DomainException;
        expect(exception.message).toBe('media.status.errors.invalid');
        expect(exception.status).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('isFinalized', () => {
    it.each([
      [TranscodingStatusType.COMPLETED, true],
      [TranscodingStatusType.CANCELED, true],
      [TranscodingStatusType.FAILED, true],
      [TranscodingStatusType.PENDING, false],
      [TranscodingStatusType.PROCESSING, false],
    ])('should return %s when status is %s', (type, expected) => {
      const status = TranscodingStatus.fromString(type);
      expect(status.isFinalized()).toBe(expected);
    });
  });

  describe('isCanceled', () => {
    it('should return true if status is CANCELED', () => {
      const status = TranscodingStatus.fromString(
        TranscodingStatusType.CANCELED,
      );
      expect(status.isCanceled()).toBe(true);
    });

    it('should return false if status is not CANCELED', () => {
      const status = TranscodingStatus.fromString(
        TranscodingStatusType.COMPLETED,
      );
      expect(status.isCanceled()).toBe(false);
    });
  });
});
