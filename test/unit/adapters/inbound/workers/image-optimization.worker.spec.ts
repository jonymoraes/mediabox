import { Test, TestingModule } from '@nestjs/testing';
import { ImageOptimizationWorker } from '@/src/adapters/inbound/workers/image-optimization.worker';
import { OptimizeImageUseCase } from '@/src/application/media/image/use-cases/optimize-image.use-case';
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';
import { Job } from 'bullmq';
import { cleanupFiles } from '@/src/platform/shared/utils/file.util';
import { Logger } from '@nestjs/common';

// Mock file utilities
jest.mock('@/src/platform/shared/utils/file.util', () => ({
  cleanupFiles: jest.fn(),
}));

describe('ImageOptimizationWorker', () => {
  let worker: ImageOptimizationWorker;
  let optimizeImageUseCase: jest.Mocked<OptimizeImageUseCase>;
  let imagePort: jest.Mocked<ImagePort>;

  const mockJob = {
    id: 'job-123',
    data: {
      accountId: 'account-abc',
      filepath: '/tmp/test.jpg',
    },
    updateProgress: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<Job>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageOptimizationWorker,
        {
          provide: OptimizeImageUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ImagePort,
          useValue: { getOptimization: jest.fn() },
        },
      ],
    }).compile();

    worker = module.get<ImageOptimizationWorker>(ImageOptimizationWorker);
    optimizeImageUseCase = module.get(OptimizeImageUseCase);
    imagePort = module.get(ImagePort);

    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should skip process if jobId is missing', async () => {
      // GIVEN
      const jobNoId = { ...mockJob, id: undefined } as any;
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation();

      // WHEN
      await worker.process(jobNoId);

      // THEN
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job ID is missing'),
      );
      expect(optimizeImageUseCase.execute).not.toHaveBeenCalled();
    });

    it('should execute optimization successfully', async () => {
      // GIVEN
      const expectedOutput = {
        success: true,
        jobId: 'job-123',
        url: 'http://cdn.com/img.jpg',
      };
      optimizeImageUseCase.execute.mockResolvedValue(expectedOutput);

      // WHEN
      const result = await worker.process(mockJob);

      // THEN
      expect(optimizeImageUseCase.execute).toHaveBeenCalledWith(
        mockJob.id,
        mockJob.data,
        expect.any(Function),
        { cancel: false },
      );
      expect(result).toEqual({
        ...expectedOutput,
        accountId: mockJob.data.accountId,
      });
    });

    it('should handle progress reporting and check for cancellation', async () => {
      // GIVEN
      const expectedOutput = {
        success: true,
        jobId: 'job-123',
        url: 'http://cdn.com/img.jpg',
      };

      optimizeImageUseCase.execute.mockImplementation(
        async (_id, _data, onProgress) => {
          await onProgress(50, 'processing');
          return expectedOutput;
        },
      );

      imagePort.getOptimization.mockResolvedValue({
        status: { isCanceled: () => true },
      } as any);

      // WHEN
      await worker.process(mockJob);

      // THEN
      expect(imagePort.getOptimization).toHaveBeenCalledWith(mockJob.id);
      expect(mockJob.updateProgress).toHaveBeenCalledWith({
        percentage: 50,
        stage: 'processing',
        accountId: mockJob.data.accountId,
      });
    });

    it('should cleanup files and rethrow error on failure', async () => {
      // GIVEN
      const error = new Error('Process failed');
      optimizeImageUseCase.execute.mockRejectedValue(error);

      // WHEN & THEN
      await expect(worker.process(mockJob)).rejects.toThrow(error);
      expect(cleanupFiles).toHaveBeenCalledWith(
        [mockJob.data.filepath],
        expect.any(Logger),
      );
    });

    it('should not cleanup files if filepath is missing on error', async () => {
      // GIVEN
      const jobNoFile = { ...mockJob, data: { accountId: '1' } } as any;
      optimizeImageUseCase.execute.mockRejectedValue(new Error('Fail'));

      // WHEN & THEN
      await expect(worker.process(jobNoFile)).rejects.toThrow();
      expect(cleanupFiles).not.toHaveBeenCalled();
    });
  });
});
