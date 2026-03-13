import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { HttpStatus } from '@nestjs/common';

// Use Case
import { VideoUploadUseCase } from '@/src/application/media/video/use-cases/video-upload.use-case';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';

// Mocks & Factories
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';

// Utils, Types & Exceptions
import * as fileUtil from '@/src/platform/shared/utils/file.util';
import { VideoUploadPayload } from '@/src/adapters/inbound/rest/transformers/video-upload.transformer';
import { Format } from '@/src/platform/shared/constants/video.constants';
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

// Mock utils
jest.mock('@/src/platform/shared/utils/file.util', () => ({
  prepareFilePath: jest.fn(),
  saveFileToDisk: jest.fn(),
}));

describe('VideoUploadUseCase', () => {
  let useCase: VideoUploadUseCase;
  let accountPort: jest.Mocked<AccountPort>;
  let quotaPort: jest.Mocked<QuotaPort>;
  let videoPort: jest.Mocked<VideoPort>;
  let transcodingQueue: any;

  const userId = 'user-123';

  const mockPayload: VideoUploadPayload = {
    file: {
      filename: 'video.mp4',
      mimetype: 'video/mp4',
      buffer: Buffer.from('fake-video-content'),
    } as any,
    format: 'mp4' as Format,
  };

  beforeEach(async () => {
    accountPort = {
      findById: jest.fn(),
    } as any;
    quotaPort = {
      findByAccountId: jest.fn(),
    } as any;
    videoPort = {
      saveTranscoding: jest.fn(),
    } as any;
    transcodingQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoUploadUseCase,
        { provide: AccountPort, useValue: accountPort },
        { provide: QuotaPort, useValue: quotaPort },
        { provide: VideoPort, useValue: videoPort },
        {
          provide: getQueueToken('video-transcoding'),
          useValue: transcodingQueue,
        },
      ],
    }).compile();

    useCase = module.get<VideoUploadUseCase>(VideoUploadUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should upload video and add it to transcoding queue successfully', async () => {
      // GIVEN
      const account = AccountFactory.load({
        id: userId,
        storagePath: '/storage/user',
      });
      const quota = QuotaFactory.load({ accountId: userId });
      const mockJobId = 'job-999';
      const mockFileSize = 5000;

      accountPort.findById.mockResolvedValue(account);
      quotaPort.findByAccountId.mockResolvedValue(quota);

      (fileUtil.prepareFilePath as jest.Mock).mockReturnValue({
        filePath: '/storage/user/final-video.mp4',
        finalName: 'final-video.mp4',
      });
      (fileUtil.saveFileToDisk as jest.Mock).mockReturnValue(mockFileSize);

      transcodingQueue.add.mockResolvedValue({ id: mockJobId });

      // WHEN
      const result = await useCase.execute(userId, mockPayload);

      // THEN
      expect(accountPort.findById).toHaveBeenCalledWith(userId);
      expect(transcodingQueue.add).toHaveBeenCalledWith(
        'transcode',
        expect.objectContaining({
          filename: 'final-video.mp4',
          accountId: userId,
        }),
      );
      expect(videoPort.saveTranscoding).toHaveBeenCalled();
      expect(result.data.jobId).toBe(mockJobId);
    });

    it('should throw AccountNotFoundException if account does not exist', async () => {
      accountPort.findById.mockResolvedValue(null);

      await expectDomainExceptionAsync(
        () => useCase.execute(userId, mockPayload),
        'identity.account.errors.not_found',
        HttpStatus.NOT_FOUND,
      );
    });

    it('should throw QuotaNotFoundException if quota does not exist', async () => {
      const account = AccountFactory.load({ id: userId, storagePath: '/path' });
      accountPort.findById.mockResolvedValue(account);
      quotaPort.findByAccountId.mockResolvedValue(null);

      await expectDomainExceptionAsync(
        () => useCase.execute(userId, mockPayload),
        'identity.quota.errors.not_found',
        HttpStatus.NOT_FOUND,
      );
    });

    it('should throw FileSystemException if BullMQ fails to create job', async () => {
      const account = AccountFactory.load({ id: userId, storagePath: '/path' });
      const quota = QuotaFactory.load({ accountId: userId });

      accountPort.findById.mockResolvedValue(account);
      quotaPort.findByAccountId.mockResolvedValue(quota);
      (fileUtil.prepareFilePath as jest.Mock).mockReturnValue({
        filePath: 'p',
        finalName: 'n',
      });

      transcodingQueue.add.mockResolvedValue({ id: undefined });

      await expectDomainExceptionAsync(
        () => useCase.execute(userId, mockPayload),
        'shared.errors.file_system_error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  });
});
