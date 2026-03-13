import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { promises as fs, existsSync } from 'fs';

// Mock de nestjs-i18n
jest.mock('nestjs-i18n', () => ({
  I18nService: jest.fn(),
}));

import { I18nService } from 'nestjs-i18n';
import { TranscodeVideoUseCase } from '@/src/application/media/video/use-cases/transcode-video.use-case';

// Ports
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Gateway
import { AccountGateway } from '@/src/adapters/inbound/ws/websockets/account.gateway';

// Mocks & Factories
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';

// Utils & Constants
import * as videoProcessorUtil from '@/src/platform/shared/utils/video-processor.util';
import * as fileUtil from '@/src/platform/shared/utils/file.util';
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

// Mocks utils
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    stat: jest.fn(),
    unlink: jest.fn(),
  },
}));

jest.mock('@/src/platform/shared/utils/video-processor.util', () => ({
  getVideoDuration: jest.fn(),
  transcodeVideo: jest.fn(),
}));

jest.mock('@/src/platform/shared/utils/file.util', () => ({
  generateOutputFilePath: jest.fn(),
  getMimeType: jest.fn(),
}));

describe('TranscodeVideoUseCase', () => {
  let useCase: TranscodeVideoUseCase;
  let videoPort: jest.Mocked<VideoPort>;
  let accountPort: jest.Mocked<AccountPort>;
  let quotaPort: jest.Mocked<QuotaPort>;
  let accountGateway: jest.Mocked<AccountGateway>;

  const jobId = 'job-transcode-123';
  const mockData = {
    filename: 'raw-video.mp4',
    filepath: '/storage/raw-video.mp4',
    filesize: 1048576,
    format: 'mp4',
    accountId: 'acc-123',
    quotaId: 'quota-123',
  };

  const onProgress = jest.fn().mockResolvedValue(undefined);
  const control = { cancel: false };

  beforeEach(async () => {
    videoPort = {
      markTranscodingProcessing: jest.fn(),
      save: jest.fn(),
    } as any;
    accountPort = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any;
    quotaPort = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any;
    accountGateway = {
      emitUpdated: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscodeVideoUseCase,
        { provide: VideoPort, useValue: videoPort },
        { provide: AccountPort, useValue: accountPort },
        { provide: QuotaPort, useValue: quotaPort },
        { provide: AccountGateway, useValue: accountGateway },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key) => key),
          },
        },
      ],
    }).compile();

    useCase = module.get<TranscodeVideoUseCase>(TranscodeVideoUseCase);

    process.env.PUBLIC_DIR = '/storage';
    process.env.STATIC = 'https://cdn.test.com';

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should transcode video and update account/quota successfully', async () => {
      const quota = QuotaFactory.load({ id: mockData.quotaId });
      const account = AccountFactory.load({
        id: mockData.accountId,
        folder: 'user-folder',
      });
      const transcodedSize = 800000;
      const outputPath = '/storage/user-folder/raw-video.mp4';

      quotaPort.findById.mockResolvedValue(quota);
      accountPort.findById.mockResolvedValue(account);
      accountPort.save.mockResolvedValue(account);

      (fileUtil.generateOutputFilePath as jest.Mock).mockReturnValue(
        outputPath,
      );
      (fileUtil.getMimeType as jest.Mock).mockReturnValue('video/mp4');
      (videoProcessorUtil.getVideoDuration as jest.Mock).mockResolvedValue(60);
      (videoProcessorUtil.transcodeVideo as jest.Mock).mockResolvedValue(
        undefined,
      );
      (fs.stat as jest.Mock).mockResolvedValue({ size: transcodedSize });
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);
      (existsSync as jest.Mock).mockReturnValue(true);

      const result = await useCase.execute(
        jobId,
        mockData,
        onProgress,
        control,
      );

      expect(result.success).toBe(true);
      expect(result.jobId).toBe(jobId);
      expect(quotaPort.save).toHaveBeenCalled();
      expect(videoPort.markTranscodingProcessing).toHaveBeenCalledWith(jobId);
      expect(videoProcessorUtil.transcodeVideo).toHaveBeenCalled();
      expect(videoPort.save).toHaveBeenCalled();
      expect(accountGateway.emitUpdated).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(100, expect.any(String));
    });

    it('should throw QuotaNotFoundException if quota does not exist', async () => {
      quotaPort.findById.mockResolvedValue(null);

      await expectDomainExceptionAsync(
        () => useCase.execute(jobId, mockData, onProgress, control),
        'identity.quota.errors.not_found',
        HttpStatus.NOT_FOUND,
      );
    });

    it('should throw AccountNotFoundException if account does not exist', async () => {
      const quota = QuotaFactory.load({ id: mockData.quotaId });
      quotaPort.findById.mockResolvedValue(quota);
      accountPort.findById.mockResolvedValue(null);

      await expectDomainExceptionAsync(
        () => useCase.execute(jobId, mockData, onProgress, control),
        'identity.account.errors.not_found',
        HttpStatus.NOT_FOUND,
      );
    });

    it('should cleanup original file if outputPath is different', async () => {
      const quota = QuotaFactory.load({ id: mockData.quotaId });
      const account = AccountFactory.load({ id: mockData.accountId });
      const outputPath = '/storage/different-path.mp4';

      quotaPort.findById.mockResolvedValue(quota);
      accountPort.findById.mockResolvedValue(account);
      accountPort.save.mockResolvedValue(account);
      (fileUtil.generateOutputFilePath as jest.Mock).mockReturnValue(
        outputPath,
      );
      (fs.stat as jest.Mock).mockResolvedValue({ size: 100 });
      (existsSync as jest.Mock).mockReturnValue(true);

      await useCase.execute(jobId, mockData, onProgress, control);

      expect(fs.unlink).toHaveBeenCalledWith(mockData.filepath);
    });
  });
});
