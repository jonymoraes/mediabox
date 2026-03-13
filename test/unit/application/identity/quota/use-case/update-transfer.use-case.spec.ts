import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UpdateTransferUseCase } from '@/src/application/identity/quota/use-case/update-transfer.use-case';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Mocks
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';
import { quotaPortMock } from '@/test/mocks/domain/identity/ports/quota.port.mock';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';

// Utils
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

describe('UpdateTransferUseCase', () => {
  let useCase: UpdateTransferUseCase;
  let accountPort: jest.Mocked<AccountPort>;
  let quotaPort: jest.Mocked<QuotaPort>;

  const accountId = '567305b3-760e-4973-afd5-2b04127eabc7';
  const fileSize = BigInt(1048576); // 1MB

  beforeEach(async () => {
    accountPort = accountPortMock();
    quotaPort = quotaPortMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTransferUseCase,
        { provide: AccountPort, useValue: accountPort },
        { provide: QuotaPort, useValue: quotaPort },
      ],
    }).compile();

    useCase = module.get<UpdateTransferUseCase>(UpdateTransferUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update transfer and persist changes successfully', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: accountId });
      const quota = QuotaFactory.load({ accountId: account.id });

      accountPort.findById.mockResolvedValue(account);
      quotaPort.findByAccountId.mockResolvedValue(quota);
      quotaPort.save.mockResolvedValue(quota);

      const addTransferSpy = jest.spyOn(quota, 'addTransfer');

      // WHEN
      await useCase.execute(accountId, fileSize);

      // THEN
      expect(accountPort.findById).toHaveBeenCalledWith(accountId);
      expect(quotaPort.findByAccountId).toHaveBeenCalledWith(account.id);
      expect(addTransferSpy).toHaveBeenCalledWith(fileSize);
      expect(quotaPort.save).toHaveBeenCalledWith(quota);
    });

    it('should throw error if account does not exist', async () => {
      // GIVEN
      accountPort.findById.mockResolvedValue(null);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(accountId, fileSize),
        'identity.account.errors.not_found',
        HttpStatus.NOT_FOUND,
      );

      expect(quotaPort.findByAccountId).not.toHaveBeenCalled();
      expect(quotaPort.save).not.toHaveBeenCalled();
    });

    it('should throw error if quota does not exist for the account', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: accountId });
      accountPort.findById.mockResolvedValue(account);
      quotaPort.findByAccountId.mockResolvedValue(null);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(accountId, fileSize),
        'identity.quota.errors.not_found',
        HttpStatus.NOT_FOUND,
      );

      expect(quotaPort.save).not.toHaveBeenCalled();
    });
  });
});
