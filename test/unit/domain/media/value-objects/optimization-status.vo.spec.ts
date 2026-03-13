import { HttpStatus } from '@nestjs/common';
import {
  OptimizationStatus,
  OptimizationStatusType,
} from '@/src/domain/media/value-objects/optimization-status.vo';
import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';

describe('OptimizationStatus', () => {
  describe('fromString', () => {
    it('should create a valid OptimizationStatus from a valid string', () => {
      const status = OptimizationStatus.fromString(
        OptimizationStatusType.PENDING,
      );

      expect(status).toBeInstanceOf(OptimizationStatus);
      expect(status.getValue()).toBe(OptimizationStatusType.PENDING);
    });

    it('should throw a DomainException when the string is invalid', () => {
      const invalidValue = 'invalid_status';

      expect(() => {
        OptimizationStatus.fromString(invalidValue);
      }).toThrow(DomainException);

      try {
        OptimizationStatus.fromString(invalidValue);
      } catch (error) {
        const exception = error as DomainException;
        expect(exception.message).toBe('media.status.errors.invalid');
        expect(exception.status).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('isFinalized', () => {
    it.each([
      [OptimizationStatusType.COMPLETED, true],
      [OptimizationStatusType.CANCELED, true],
      [OptimizationStatusType.FAILED, true],
      [OptimizationStatusType.PENDING, false],
      [OptimizationStatusType.PROCESSING, false],
    ])('should return %s when status is %s', (type, expected) => {
      const status = OptimizationStatus.fromString(type);
      expect(status.isFinalized()).toBe(expected);
    });
  });

  describe('isCanceled', () => {
    it('should return true if status is CANCELED', () => {
      const status = OptimizationStatus.fromString(
        OptimizationStatusType.CANCELED,
      );
      expect(status.isCanceled()).toBe(true);
    });

    it('should return false if status is not CANCELED', () => {
      const status = OptimizationStatus.fromString(
        OptimizationStatusType.PROCESSING,
      );
      expect(status.isCanceled()).toBe(false);
    });
  });
});
