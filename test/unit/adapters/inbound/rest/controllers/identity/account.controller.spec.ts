import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from '@/src/adapters/inbound/rest/controllers/identity/account.controller';
import { GetAccountUseCase } from '@/src/application/identity/account/use-cases/get-account.use-case';
import { GetAccountListUseCase } from '@/src/application/identity/account/use-cases/get-account-list.use-case';
import { CreateAccountUseCase } from '@/src/application/identity/account/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '@/src/application/identity/account/use-cases/update-account.use-case';
import { DeleteAccountUseCase } from '@/src/application/identity/account/use-cases/delete-account.use-case';
import { AuthenticateGuard } from '@/src/adapters/inbound/rest/guards/authenticate.guard';
import { AuthorizeGuard } from '@/src/adapters/inbound/rest/guards/authorize.guard';
import { CreateAccountDto } from '@/src/application/identity/account/dto/input/create-account.dto';
import { UpdateAccountDto } from '@/src/application/identity/account/dto/input/update-account.dto';
import { PaginationQueryDto } from '@/src/application/shared-dto/input/pagination-query.dto';
import { Session } from '@/src/adapters/inbound/rest/interfaces/auth.interface';
import { AccountToDto } from '@/src/application/identity/account/dto/output/account.to-dto';

describe('AccountController', () => {
  let controller: AccountController;
  let getAccountUseCase: jest.Mocked<GetAccountUseCase>;
  let getAccountListUseCase: jest.Mocked<GetAccountListUseCase>;
  let createAccountUseCase: jest.Mocked<CreateAccountUseCase>;
  let updateAccountUseCase: jest.Mocked<UpdateAccountUseCase>;
  let deleteAccountUseCase: jest.Mocked<DeleteAccountUseCase>;

  const mockGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: GetAccountUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetAccountListUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CreateAccountUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateAccountUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteAccountUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthenticateGuard)
      .useValue(mockGuard)
      .overrideGuard(AuthorizeGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AccountController>(AccountController);
    getAccountUseCase = module.get(GetAccountUseCase);
    getAccountListUseCase = module.get(GetAccountListUseCase);
    createAccountUseCase = module.get(CreateAccountUseCase);
    updateAccountUseCase = module.get(UpdateAccountUseCase);
    deleteAccountUseCase = module.get(DeleteAccountUseCase);
  });

  describe('getAccount', () => {
    it('should return current account details using user.sub', async () => {
      const mockSession = { sub: 'uuid-123' } as Session;
      const mockOutput = {
        account: {
          id: 'uuid-123',
          name: 'Test Account',
          domain: 'test.com',
        } as any,
      };
      getAccountUseCase.execute.mockResolvedValue(mockOutput);

      const result = await controller.getAccount(mockSession);

      expect(getAccountUseCase.execute).toHaveBeenCalledWith(mockSession.sub);
      expect(result).toEqual(mockOutput);
    });
  });

  describe('getAccounts', () => {
    it('should return a paginated list of accounts for admin', async () => {
      const dto: PaginationQueryDto = { page: 1, limit: 10 };
      const mockOutput = {
        items: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 } as any,
      };
      getAccountListUseCase.execute.mockResolvedValue(mockOutput);

      const result = await controller.getAccounts(dto);

      expect(getAccountListUseCase.execute).toHaveBeenCalledWith(
        dto.page,
        dto.limit,
      );
      expect(result).toEqual(mockOutput);
    });
  });

  describe('create', () => {
    it('should create a new account and return an apikey', async () => {
      const dto: CreateAccountDto = { name: 'New Corp', domain: 'corp.com' };
      const mockOutput = {
        message: 'Account created',
        data: { apikey: 'ak_live_123' },
      };
      createAccountUseCase.execute.mockResolvedValue(mockOutput);

      const result = await controller.create(dto);

      expect(createAccountUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockOutput);
    });
  });

  describe('updateAccount', () => {
    it('should update account data and return success message with data', async () => {
      const mockSession = { sub: 'uuid-123' } as Session;
      const dto: UpdateAccountDto = { name: 'Updated Name' };

      const mockOutput = {
        message: 'identity.account.messages.updated',
        data: {
          account: {
            id: 'uuid-123',
            name: 'Updated Name',
            domain: 'test.com',
          } as AccountToDto,
        },
      };

      updateAccountUseCase.execute.mockResolvedValue(mockOutput);

      const result = await controller.updateAccount(dto, mockSession);

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith(
        mockSession.sub,
        dto,
      );
      expect(result).toEqual(mockOutput);
    });
  });

  describe('deleteAccount', () => {
    it('should remove the account associated with the session', async () => {
      const mockSession = { sub: 'uuid-123' } as Session;
      const mockOutput = { message: 'Account deleted successfully' };
      deleteAccountUseCase.execute.mockResolvedValue(mockOutput);

      const result = await controller.deleteAccount(mockSession);

      expect(deleteAccountUseCase.execute).toHaveBeenCalledWith(
        mockSession.sub,
      );
      expect(result).toEqual(mockOutput);
    });
  });
});
