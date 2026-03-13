import { Test, TestingModule } from '@nestjs/testing';
import { UpdateAccountUseCase } from '@/src/application/identity/account/use-cases/update-account.use-case';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Mocks
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';

// Utils
import * as fileUtils from '@/src/platform/shared/utils/file.util';

// Mock de utilidades de archivos
jest.mock('@/src/platform/shared/utils/file.util', () => ({
  movePath: jest.fn(),
  generateFolderPath: jest.requireActual(
    '@/src/platform/shared/utils/file.util',
  ).generateFolderPath,
}));

describe('UpdateAccountUseCase', () => {
  let useCase: UpdateAccountUseCase;
  let accountPort: jest.Mocked<AccountPort>;

  const accountId = 'acc-123';
  const SUCCESS_MSG = 'identity.account.messages.updated';

  beforeEach(async () => {
    accountPort = accountPortMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAccountUseCase,
        { provide: AccountPort, useValue: accountPort },
      ],
    }).compile();

    useCase = module.get<UpdateAccountUseCase>(UpdateAccountUseCase);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update domain and move storage path successfully', async () => {
      // GIVEN
      const oldDomain = 'old-project.com';
      const newDomain = 'new-project.com';

      const account = AccountFactory.load({
        id: accountId,
        domain: oldDomain,
        storagePath: `public/old-project.com`,
      });

      accountPort.findById.mockResolvedValue(account);
      accountPort.findByDomain.mockResolvedValue(null);

      // WHEN
      const result = await useCase.execute(accountId, { domain: newDomain });

      // THEN
      expect(account.domain).toBe(newDomain);
      expect(fileUtils.movePath).toHaveBeenCalledWith(
        'public/old-project.com',
        'public/new-project.com',
      );
      expect(accountPort.save).toHaveBeenCalledWith(account);
      expect(result.message).toBe(SUCCESS_MSG);
    });

    it('should fail if account does not exist', async () => {
      // GIVEN
      accountPort.findById.mockResolvedValue(null);

      // WHEN & THEN
      await expect(
        useCase.execute(accountId, { domain: 'any.com' }),
      ).rejects.toThrow('identity.account.errors.not_found');

      expect(accountPort.save).not.toHaveBeenCalled();
      expect(fileUtils.movePath).not.toHaveBeenCalled();
    });

    it('should fail if new domain is already taken', async () => {
      // GIVEN
      const account = AccountFactory.load({
        id: accountId,
        domain: 'original.com',
      });
      const existingAccount = AccountFactory.load({
        id: 'other-acc',
        domain: 'taken.com',
      });

      accountPort.findById.mockResolvedValue(account);
      accountPort.findByDomain.mockResolvedValue(existingAccount);

      // WHEN & THEN
      await expect(
        useCase.execute(accountId, { domain: 'taken.com' }),
      ).rejects.toThrow('identity.account.errors.already_exists');

      expect(fileUtils.movePath).not.toHaveBeenCalled();
      expect(accountPort.save).not.toHaveBeenCalled();
    });

    it('should not call movePath if domain remains the same', async () => {
      // GIVEN
      const domain = 'same-domain.com';
      const account = AccountFactory.load({ id: accountId, domain });
      accountPort.findById.mockResolvedValue(account);

      // WHEN
      const result = await useCase.execute(accountId, { domain });

      // THEN
      expect(fileUtils.movePath).not.toHaveBeenCalled();
      expect(accountPort.save).toHaveBeenCalled();
      expect(result.message).toBe(SUCCESS_MSG);
    });

    it('should not call movePath if oldPath is missing', async () => {
      // GIVEN
      const account = AccountFactory.load({
        id: accountId,
        domain: '',
        storagePath: '',
      });

      accountPort.findById.mockResolvedValue(account);
      accountPort.findByDomain.mockResolvedValue(null);

      // WHEN
      const result = await useCase.execute(accountId, {
        domain: 'first-domain.com',
      });

      // THEN
      expect(fileUtils.movePath).not.toHaveBeenCalled();
      expect(accountPort.save).toHaveBeenCalled();
      expect(result.message).toBe(SUCCESS_MSG);
    });
  });
});
