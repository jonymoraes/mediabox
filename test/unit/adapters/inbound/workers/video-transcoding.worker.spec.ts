import { Test, TestingModule } from '@nestjs/testing';
import { VideoTranscodingWorker } from '@/src/adapters/inbound/workers/video-transcoding.worker';
import { TranscodeVideoUseCase } from '@/src/application/media/video/use-cases/transcode-video.use-case';
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';
import { Job } from 'bullmq';
import { cleanupFiles } from '@/src/platform/shared/utils/file.util';
import { Logger } from '@nestjs/common';

// Mock file utilities
jest.mock('@/src/platform/shared/utils/file.util', () => ({
  cleanupFiles: jest.fn(),
}));

describe('VideoTranscodingWorker', () => {
  let worker: VideoTranscodingWorker;
  let transcodeVideoUseCase: jest.Mocked<TranscodeVideoUseCase>;
  let videoPort: jest.Mocked<VideoPort>;

  const mockJob = {
    id: 'job-video-123',
    data: {
      accountId: 'account-video-abc',
      filepath: '/tmp/test.mp4',
    },
    updateProgress: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<Job>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoTranscodingWorker,
        {
          provide: TranscodeVideoUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: VideoPort,
          useValue: { getTranscoding: jest.fn() },
        },
      ],
    }).compile();

    worker = module.get<VideoTranscodingWorker>(VideoTranscodingWorker);
    transcodeVideoUseCase = module.get(TranscodeVideoUseCase);
    videoPort = module.get(VideoPort);

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
      expect(transcodeVideoUseCase.execute).not.toHaveBeenCalled();
    });

    it('should execute transcoding successfully', async () => {
      // GIVEN
      const expectedOutput = {
        success: true,
        jobId: 'job-video-123',
        url: 'http://cdn.com/video.mp4',
      };
      transcodeVideoUseCase.execute.mockResolvedValue(expectedOutput as any);

      // WHEN
      const result = await worker.process(mockJob);

      // THEN
      expect(transcodeVideoUseCase.execute).toHaveBeenCalledWith(
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
        jobId: 'job-video-123',
        url: 'http://cdn.com/video.mp4',
      };

      transcodeVideoUseCase.execute.mockImplementation(
        async (_id, _data, onProgress) => {
          await onProgress(75, 'transcoding');
          return expectedOutput as any;
        },
      );

      videoPort.getTranscoding.mockResolvedValue({
        status: { isCanceled: () => true },
      } as any);

      // WHEN
      await worker.process(mockJob);

      // THEN
      expect(videoPort.getTranscoding).toHaveBeenCalledWith(mockJob.id);
      expect(mockJob.updateProgress).toHaveBeenCalledWith({
        percentage: 75,
        stage: 'transcoding',
        accountId: mockJob.data.accountId,
      });
    });

    it('should cleanup files and rethrow error on failure', async () => {
      // GIVEN
      const error = new Error('Transcoding failed');
      transcodeVideoUseCase.execute.mockRejectedValue(error);

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
      transcodeVideoUseCase.execute.mockRejectedValue(new Error('Fail'));

      // WHEN & THEN
      await expect(worker.process(jobNoFile)).rejects.toThrow();
      expect(cleanupFiles).not.toHaveBeenCalled();
    });
  });
});
