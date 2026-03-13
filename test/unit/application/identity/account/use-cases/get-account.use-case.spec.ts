import { Test, TestingModule } from '@nestjs/testing';
import { GetAccountUseCase } from '@/src/application/identity/account/use-cases/get-account.use-case';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Mocks
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';

// Dto
import { AccountToDto } from '@/src/application/identity/account/dto/output/account.to-dto';

// i18n
import { I18nService } from 'nestjs-i18n';

describe('GetAccountUseCase', () => {
  let useCase: GetAccountUseCase;
  let accountPort: jest.Mocked<AccountPort>;
  let i18n: jest.Mocked<I18nService>;

  const accountId = 'acc-123';

  beforeEach(async () => {
    accountPort = accountPortMock();
    i18n = { t: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAccountUseCase,
        { provide: AccountPort, useValue: accountPort },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    useCase = module.get<GetAccountUseCase>(GetAccountUseCase);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return account dto successfully', async () => {
      // GIVEN
      const account = AccountFactory.load({
        id: accountId,
        name: 'Test Account',
        usedBytes: BigInt(1024),
      });

      accountPort.findById.mockResolvedValue(account);

      // WHEN
      const result = await useCase.execute(accountId);

      // THEN
      expect(accountPort.findById).toHaveBeenCalledWith(accountId);
      expect(result.account).toBeInstanceOf(AccountToDto);
      expect(result.account.id).toBe(accountId);
      expect(result.account.usedBytes).toBe('1024');
      expect(result.account.name).toBe('Test Account');
    });

    it('should fail if account does not exist', async () => {
      // GIVEN
      accountPort.findById.mockResolvedValue(null);

      // WHEN & THEN
      try {
        await useCase.execute(accountId);
        fail('Should have thrown AccountNotFoundException');
      } catch (error: any) {
        expect(error.message).toBe('identity.account.errors.not_found');
      }

      expect(accountPort.findById).toHaveBeenCalledWith(accountId);
    });
  });
});
