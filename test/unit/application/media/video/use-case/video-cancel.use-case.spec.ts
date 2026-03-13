import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

// Use Case
import { VideoCancelUseCase } from '@/src/application/media/video/use-cases/video-cancel.use-case';

// Ports
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';

// Value Objects & Types
import {
  TranscodingStatus,
  TranscodingStatusType,
} from '@/src/domain/media/value-objects/transcoding-status.vo';
import { VideoTranscoding } from '@/src/platform/shared/types/video-transcoding.type';

// Utils
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

describe('VideoCancelUseCase', () => {
  let useCase: VideoCancelUseCase;
  let videoPort: jest.Mocked<VideoPort>;

  const jobId = 'job-123';

  const mockTranscoding = (
    status: TranscodingStatusType,
  ): VideoTranscoding => ({
    taskId: jobId,
    status: TranscodingStatus.fromString(status),
    filename: 'test-video.mp4',
    filepath: '/path/test-video.mp4',
    mimetype: 'video/mp4',
    filesize: 2048,
    format: 'mp4',
    accountId: 'acc-1',
    quotaId: 'quota-1',
  });

  beforeEach(async () => {
    videoPort = {
      getTranscoding: jest.fn(),
      markTranscodingCanceled: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoCancelUseCase,
        { provide: VideoPort, useValue: videoPort },
      ],
    }).compile();

    useCase = module.get<VideoCancelUseCase>(VideoCancelUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should cancel the transcoding job successfully', async () => {
      // GIVEN
      const transcoding = mockTranscoding(TranscodingStatusType.PENDING);
      videoPort.getTranscoding.mockResolvedValue(transcoding);
      videoPort.markTranscodingCanceled.mockResolvedValue();

      // WHEN
      const result = await useCase.execute(jobId);

      // THEN
      expect(videoPort.getTranscoding).toHaveBeenCalledWith(jobId);
      expect(videoPort.markTranscodingCanceled).toHaveBeenCalledWith(jobId);
      expect(result.message).toBe('shared.job_status.messages.canceled');
    });

    it('should throw FileNotFoundException if transcoding job is not found', async () => {
      // GIVEN
      videoPort.getTranscoding.mockResolvedValue(null);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(jobId),
        'shared.errors.file_not_found',
        HttpStatus.NOT_FOUND,
      );

      expect(videoPort.markTranscodingCanceled).not.toHaveBeenCalled();
    });

    it('should throw JobAlreadyCanceledException if job is already canceled', async () => {
      // GIVEN
      const transcoding = mockTranscoding(TranscodingStatusType.CANCELED);
      videoPort.getTranscoding.mockResolvedValue(transcoding);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(jobId),
        'shared.job_status.errors.alreadyCanceled',
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should throw JobAlreadyFinalizedException if job is already completed', async () => {
      // GIVEN
      const transcoding = mockTranscoding(TranscodingStatusType.COMPLETED);
      videoPort.getTranscoding.mockResolvedValue(transcoding);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(jobId),
        'shared.job_status.errors.alreadyFinalized',
        HttpStatus.BAD_REQUEST,
      );
    });
  });
});
