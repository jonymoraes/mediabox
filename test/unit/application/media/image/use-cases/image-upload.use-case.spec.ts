import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { HttpStatus } from '@nestjs/common';
import { ImageUploadUseCase } from '@/src/application/media/image/use-cases/image-upload.use-case';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';

// Factories & Mocks
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';
import { ImageFileFactory } from '@/test/mocks/domain/media/value-objects/image-file.factory';
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';
import { quotaPortMock } from '@/test/mocks/domain/identity/ports/quota.port.mock';

// Utils
import * as fileUtils from '@/src/platform/shared/utils/file.util';
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

jest.mock('@/src/platform/shared/utils/file.util', () => ({
  prepareFilePath: jest.fn(),
  saveFileToDisk: jest.fn(),
}));

describe('ImageUploadUseCase', () => {
  let useCase: ImageUploadUseCase;
  let accountPort: jest.Mocked<AccountPort>;
  let quotaPort: jest.Mocked<QuotaPort>;
  let imagePort: jest.Mocked<ImagePort>;
  let optimizationQueue: any;

  const userId = 'user-123';
  const mockFile = ImageFileFactory.create();
  const payload = { file: mockFile, context: 'profile' };

  beforeEach(async () => {
    accountPort = accountPortMock();
    quotaPort = quotaPortMock();
    imagePort = { saveOptimization: jest.fn() } as any;
    optimizationQueue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageUploadUseCase,
        { provide: AccountPort, useValue: accountPort },
        { provide: QuotaPort, useValue: quotaPort },
        { provide: ImagePort, useValue: imagePort },
        {
          provide: getQueueToken('image-optimization'),
          useValue: optimizationQueue,
        },
      ],
    }).compile();

    useCase = module.get<ImageUploadUseCase>(ImageUploadUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should upload image and queue optimization successfully', async () => {
      // GIVEN
      const account = AccountFactory.load({
        id: userId,
        storagePath: '/root/storage',
      });
      const quota = QuotaFactory.load({ accountId: userId });
      const mockJobId = 'job-456';

      accountPort.findById.mockResolvedValue(account);
      quotaPort.findByAccountId.mockResolvedValue(quota);
      (fileUtils.prepareFilePath as jest.Mock).mockReturnValue({
        filePath: '/root/storage/final-name.jpg',
        finalName: 'final-name.jpg',
      });
      (fileUtils.saveFileToDisk as jest.Mock).mockReturnValue(mockFile.size);
      optimizationQueue.add.mockResolvedValue({ id: mockJobId });

      // WHEN
      const result = await useCase.execute(userId, payload as any);

      // THEN
      expect(result.data.jobId).toBe(mockJobId);
      expect(imagePort.saveOptimization).toHaveBeenCalled();
    });

    it('should throw error if account or storagePath is missing', async () => {
      accountPort.findById.mockResolvedValue(null);

      await expectDomainExceptionAsync(
        () => useCase.execute(userId, payload as any),
        'identity.account.errors.not_found',
        HttpStatus.NOT_FOUND,
      );
    });

    it('should throw error if quota does not exist', async () => {
      const account = AccountFactory.load({
        id: userId,
        storagePath: '/some/path',
      });
      accountPort.findById.mockResolvedValue(account);
      quotaPort.findByAccountId.mockResolvedValue(null);

      await expectDomainExceptionAsync(
        () => useCase.execute(userId, payload as any),
        'identity.quota.errors.not_found',
        HttpStatus.NOT_FOUND,
      );
    });

    it('should throw error if queue fails to return a job id', async () => {
      const account = AccountFactory.load({ id: userId, storagePath: '/path' });
      const quota = QuotaFactory.load({ accountId: userId });

      accountPort.findById.mockResolvedValue(account);
      quotaPort.findByAccountId.mockResolvedValue(quota);
      (fileUtils.prepareFilePath as jest.Mock).mockReturnValue({
        filePath: 'f',
        finalName: 'n',
      });
      optimizationQueue.add.mockResolvedValue({ id: undefined });

      await expectDomainExceptionAsync(
        () => useCase.execute(userId, payload as any),
        'shared.errors.file_system_error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  });
});
