import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ImageCancelUseCase } from '@/src/application/media/image/use-cases/image-cancel.use-case';

// Ports
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';

// Value Objects & Types
import {
  OptimizationStatus,
  OptimizationStatusType,
} from '@/src/domain/media/value-objects/optimization-status.vo';
import { ImageOptimization } from '@/src/platform/shared/types/image-optimization.type';

// Utils
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

describe('ImageCancelUseCase', () => {
  let useCase: ImageCancelUseCase;
  let imagePort: jest.Mocked<ImagePort>;

  const jobId = 'job-123';

  const mockOptimization = (
    status: OptimizationStatusType,
  ): ImageOptimization => ({
    taskId: jobId,
    status: OptimizationStatus.fromString(status),
    filename: 'test.jpg',
    filepath: '/path/test.jpg',
    mimetype: 'image/jpeg',
    filesize: 1024,
    context: 'profile_picture',
    accountId: 'acc-1',
    quotaId: 'quota-1',
  });

  beforeEach(async () => {
    imagePort = {
      getOptimization: jest.fn(),
      markOptimizationCanceled: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageCancelUseCase,
        { provide: ImagePort, useValue: imagePort },
      ],
    }).compile();

    useCase = module.get<ImageCancelUseCase>(ImageCancelUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should cancel the job successfully', async () => {
      // GIVEN
      const optimization = mockOptimization(OptimizationStatusType.PENDING);
      imagePort.getOptimization.mockResolvedValue(optimization);
      imagePort.markOptimizationCanceled.mockResolvedValue();

      // WHEN
      const result = await useCase.execute(jobId);

      // THEN
      expect(imagePort.getOptimization).toHaveBeenCalledWith(jobId);
      expect(imagePort.markOptimizationCanceled).toHaveBeenCalledWith(jobId);
      expect(result.message).toBe('shared.job_status.messages.canceled');
    });

    it('should throw error if optimization job is not found', async () => {
      // GIVEN
      imagePort.getOptimization.mockResolvedValue(null);

      // THEN: FileNotFoundException ahora es 404
      await expectDomainExceptionAsync(
        () => useCase.execute(jobId),
        'shared.errors.file_not_found',
        HttpStatus.NOT_FOUND,
      );

      expect(imagePort.markOptimizationCanceled).not.toHaveBeenCalled();
    });

    it('should throw error if job is already canceled', async () => {
      // GIVEN
      const optimization = mockOptimization(OptimizationStatusType.CANCELED);
      imagePort.getOptimization.mockResolvedValue(optimization);

      // THEN: Key corregido a camelCase 'alreadyCanceled'
      await expectDomainExceptionAsync(
        () => useCase.execute(jobId),
        'shared.job_status.errors.alreadyCanceled',
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should throw error if job is already finalized (completed)', async () => {
      // GIVEN
      const optimization = mockOptimization(OptimizationStatusType.COMPLETED);
      imagePort.getOptimization.mockResolvedValue(optimization);

      // THEN: Key corregido a camelCase 'alreadyFinalized'
      await expectDomainExceptionAsync(
        () => useCase.execute(jobId),
        'shared.job_status.errors.alreadyFinalized',
        HttpStatus.BAD_REQUEST,
      );
    });
  });
});
