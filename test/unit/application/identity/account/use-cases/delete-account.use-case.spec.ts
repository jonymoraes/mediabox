import { Test, TestingModule } from '@nestjs/testing';
import { DeleteAccountUseCase } from '@/src/application/identity/account/use-cases/delete-account.use-case';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Mocks
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';
import { quotaPortMock } from '@/test/mocks/domain/identity/ports/quota.port.mock';

// Utils
import * as fileUtils from '@/src/platform/shared/utils/file.util';

// i18n
import { I18nService } from 'nestjs-i18n';

// Mock
jest.mock('@/src/platform/shared/utils/file.util', () => ({
  removePath: jest.fn(),
}));

describe('DeleteAccountUseCase', () => {
  let useCase: DeleteAccountUseCase;
  let accountPort: jest.Mocked<AccountPort>;
  let quotaPort: jest.Mocked<QuotaPort>;
  let i18n: jest.Mocked<I18nService>;

  const accountId = 'acc-123';

  beforeEach(async () => {
    accountPort = accountPortMock();
    quotaPort = quotaPortMock();
    i18n = { t: jest.fn().mockReturnValue('deleted') } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAccountUseCase,
        { provide: AccountPort, useValue: accountPort },
        { provide: QuotaPort, useValue: quotaPort },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    useCase = module.get<DeleteAccountUseCase>(DeleteAccountUseCase);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete account, quota and storage successfully', async () => {
      accountPort.findById.mockResolvedValue({
        id: accountId,
        storagePath: '/path/to/storage',
      } as any);

      await useCase.execute(accountId);

      expect(fileUtils.removePath).toHaveBeenCalledWith('/path/to/storage');
      expect(quotaPort.delete).toHaveBeenCalledWith(accountId);
      expect(accountPort.delete).toHaveBeenCalledWith(accountId);
    });

    it('should fail if account does not exist', async () => {
      accountPort.findById.mockResolvedValue(null);

      try {
        await useCase.execute(accountId);
        fail('Should have failed');
      } catch (error: any) {
        expect(error.message).toBe('identity.account.errors.not_found');
      }
    });

    it('should not call removePath if account has no storagePath', async () => {
      accountPort.findById.mockResolvedValue({
        id: accountId,
        storagePath: null,
      } as any);

      // WHEN
      await useCase.execute(accountId);

      // THEN
      expect(fileUtils.removePath).not.toHaveBeenCalled();
      expect(accountPort.delete).toHaveBeenCalledWith(accountId);
      expect(quotaPort.delete).toHaveBeenCalledWith(accountId);
    });
  });
});
