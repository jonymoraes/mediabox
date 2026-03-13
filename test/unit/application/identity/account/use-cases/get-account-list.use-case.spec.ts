import { Test, TestingModule } from '@nestjs/testing';

// Use Case
import { GetAccountListUseCase } from '@/src/application/identity/account/use-cases/get-account-list.use-case';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Mocks & Factories
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';

describe('GetAccountListUseCase', () => {
  let useCase: GetAccountListUseCase;
  let accountPort: jest.Mocked<AccountPort>;

  beforeEach(async () => {
    accountPort = accountPortMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAccountListUseCase,
        { provide: AccountPort, useValue: accountPort },
      ],
    }).compile();

    useCase = module.get<GetAccountListUseCase>(GetAccountListUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return a paginated list of accounts', async () => {
      // GIVEN
      const page = 1;
      const limit = 10;
      const totalItems = 2;
      const accounts = [
        AccountFactory.load({
          id: 'acc-1',
          name: 'Account 1',
          usedBytes: BigInt(100),
        }),
        AccountFactory.load({
          id: 'acc-2',
          name: 'Account 2',
          usedBytes: BigInt(200),
        }),
      ];

      accountPort.findAll.mockResolvedValue([accounts, totalItems]);

      // WHEN
      const result = await useCase.execute(page, limit);

      // THEN
      expect(accountPort.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: limit,
        orderBy: 'createdAt',
        orderDirection: 'DESC',
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('acc-1');

      expect(result.meta).toMatchObject({
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
      });
    });

    it('should calculate skip correctly for different pages', async () => {
      // GIVEN
      const page = 3;
      const limit = 5;
      accountPort.findAll.mockResolvedValue([[], 0]);

      // WHEN
      await useCase.execute(page, limit);

      // THEN
      expect(accountPort.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });

    it('should handle empty results', async () => {
      // GIVEN
      accountPort.findAll.mockResolvedValue([[], 0]);

      // WHEN
      const result = await useCase.execute(1, 10);

      // THEN
      expect(result.items).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });
});
