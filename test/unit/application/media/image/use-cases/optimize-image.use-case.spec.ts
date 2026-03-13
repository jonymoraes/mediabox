import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { promises as fs } from 'fs';

// Mock de nestjs-i18n
jest.mock('nestjs-i18n', () => ({
  I18nService: jest.fn(),
}));

// Import i18nService
import { I18nService } from 'nestjs-i18n';

// Use Case
import { OptimizeImageUseCase } from '@/src/application/media/image/use-cases/optimize-image.use-case';

// Ports
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Gateway
import { AccountGateway } from '@/src/adapters/inbound/ws/websockets/account.gateway';

// Mocks & Factories
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';

// Utils & Constants
import * as imageProcessorUtil from '@/src/platform/shared/utils/image-processor.util';
import { Context } from '@/src/platform/shared/constants/image.constants';
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

// Mocks de utilidades y FS
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
  },
}));

jest.mock('@/src/platform/shared/utils/image-processor.util', () => ({
  transform: jest.fn(),
}));

describe('OptimizeImageUseCase', () => {
  let useCase: OptimizeImageUseCase;
  let imagePort: jest.Mocked<ImagePort>;
  let accountPort: jest.Mocked<AccountPort>;
  let quotaPort: jest.Mocked<QuotaPort>;
  let accountGateway: jest.Mocked<AccountGateway>;

  const jobId = 'job-123';
  const mockData = {
    filename: 'test.jpg',
    filepath: '/tmp/test.jpg',
    filesize: 1024,
    context: Context.GENERIC,
    accountId: 'acc-1',
    quotaId: 'quota-1',
  };

  const onProgress = jest.fn().mockResolvedValue(undefined);
  const control = { cancel: false };

  beforeEach(async () => {
    imagePort = {
      markOptimizationProcessing: jest.fn(),
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
        OptimizeImageUseCase,
        { provide: ImagePort, useValue: imagePort },
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

    useCase = module.get<OptimizeImageUseCase>(OptimizeImageUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should optimize image and update account/quota successfully', async () => {
      // GIVEN
      const quota = QuotaFactory.load({ id: mockData.quotaId });
      const account = AccountFactory.load({
        id: mockData.accountId,
        folder: 'user-folder',
      });
      const convertedSize = 512;

      quotaPort.findById.mockResolvedValue(quota);
      accountPort.findById.mockResolvedValue(account);
      accountPort.save.mockResolvedValue(account);
      (fs.stat as jest.Mock).mockResolvedValue({ size: convertedSize });
      (imageProcessorUtil.transform as jest.Mock).mockResolvedValue(undefined);

      // WHEN
      const result = await useCase.execute(
        jobId,
        mockData,
        onProgress,
        control,
      );

      // THEN
      expect(result.success).toBe(true);
      expect(imagePort.save).toHaveBeenCalled();
      expect(accountGateway.emitUpdated).toHaveBeenCalled();
    });

    it('should throw QuotaNotFoundException if quota does not exist', async () => {
      // GIVEN
      quotaPort.findById.mockResolvedValue(null);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(jobId, mockData, onProgress, control),
        'identity.quota.errors.not_found',
        HttpStatus.NOT_FOUND,
      );
    });

    it('should throw AccountNotFoundException if account does not exist', async () => {
      // GIVEN
      const quota = QuotaFactory.load({ id: mockData.quotaId });
      quotaPort.findById.mockResolvedValue(quota);
      accountPort.findById.mockResolvedValue(null);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(jobId, mockData, onProgress, control),
        'identity.account.errors.not_found',
        HttpStatus.NOT_FOUND,
      );
    });
  });
});
