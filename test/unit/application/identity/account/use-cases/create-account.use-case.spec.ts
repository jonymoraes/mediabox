import { Test, TestingModule } from '@nestjs/testing';
import { CreateAccountUseCase } from '@/src/application/identity/account/use-cases/create-account.use-case';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Domain
import { Account } from '@/src/domain/identity/entities/account.entity';
import { Quota } from '@/src/domain/identity/entities/quota.entity';

// Mocks
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';
import { quotaPortMock } from '@/test/mocks/domain/identity/ports/quota.port.mock';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';

// DTO
import { CreateAccountDto } from '@/src/application/identity/account/dto/input/create-account.dto';

// Utils
import * as fileUtils from '@/src/platform/shared/utils/file.util';

jest.mock('@/src/platform/shared/utils/file.util', () => ({
  ensureDir: jest.fn(),
  generateFolderPath: jest.requireActual(
    '@/src/platform/shared/utils/file.util',
  ).generateFolderPath,
}));

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;
  let accountPort: jest.Mocked<AccountPort>;
  let quotaPort: jest.Mocked<QuotaPort>;

  const validDto: CreateAccountDto = {
    name: 'Project Alpha',
    domain: 'project-alpha.com',
  };

  beforeEach(async () => {
    accountPort = accountPortMock();
    quotaPort = quotaPortMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAccountUseCase,
        { provide: AccountPort, useValue: accountPort },
        { provide: QuotaPort, useValue: quotaPort },
      ],
    }).compile();

    useCase = module.get<CreateAccountUseCase>(CreateAccountUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a new account and its quota successfully', async () => {
      accountPort.findByDomain.mockResolvedValue(null);
      accountPort.save.mockImplementation((account) => {
        return Promise.resolve(
          AccountFactory.load({
            id: 'acc-generated-uuid',
            name: account.name,
            domain: account.domain,
            storagePath: account.storagePath,
          }),
        );
      });
      quotaPort.save.mockImplementation((quota) => Promise.resolve(quota));

      const result = await useCase.execute(validDto);

      expect(accountPort.findByDomain).toHaveBeenCalledWith(validDto.domain);
      expect(fileUtils.ensureDir).toHaveBeenCalledWith(
        expect.stringContaining('project-alpha.com'),
      );
      expect(accountPort.save).toHaveBeenCalledWith(expect.any(Account));
      expect(quotaPort.save).toHaveBeenCalledWith(expect.any(Quota));

      const savedQuota = quotaPort.save.mock.calls[0][0];
      expect(savedQuota.accountId).toBe('acc-generated-uuid');

      expect(result.message).toBe('identity.account.messages.created');
      expect(result.data.apikey).toBeDefined();
    });

    it('should fail if domain is already taken', async () => {
      const existingAccount = AccountFactory.load({ domain: validDto.domain });
      accountPort.findByDomain.mockResolvedValue(existingAccount);

      try {
        await useCase.execute(validDto);
        fail('Should have failed with AccountAlreadyExistsException');
      } catch (error: any) {
        expect(error.message).toBe('identity.account.errors.already_exists');
      }

      expect(accountPort.save).not.toHaveBeenCalled();
      expect(quotaPort.save).not.toHaveBeenCalled();
    });

    it('should fail if domain name results in an invalid folder', async () => {
      const invalidDto = { ...validDto, domain: '' };
      accountPort.findByDomain.mockResolvedValue(null);

      await expect(useCase.execute(invalidDto)).rejects.toThrow();
      expect(accountPort.save).not.toHaveBeenCalled();
    });

    it('should not call ensureDir if account storagePath is not generated', async () => {
      const dtoNoDomain = { name: 'Local Only', domain: undefined } as any;
      accountPort.findByDomain.mockResolvedValue(null);
      accountPort.save.mockImplementation(() =>
        Promise.resolve(
          AccountFactory.load({ domain: null, storagePath: null }),
        ),
      );

      await useCase.execute(dtoNoDomain);

      expect(fileUtils.ensureDir).not.toHaveBeenCalled();
    });
  });
});
