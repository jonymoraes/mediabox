import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  UseGuards,
  Delete,
} from '@nestjs/common';

// Guards
import { AuthenticateGuard } from '../../guards/authenticate.guard';
import { AuthorizeGuard } from '../../guards/authorize.guard';

// Decorators
import { User } from '../../decorators/user.decorator';
import { Session } from '../../interfaces/auth.interface';
import { Authorize } from '../../decorators/authorize.decorator';

// VO & Dto
import { RoleType } from '@/src/domain/identity/value-objects/role.vo';
import { PaginationQueryDto } from '@/src/application/shared-dto/input/pagination-query.dto';
import { CreateAccountDto } from '@/src/application/identity/account/dto/input/create-account.dto';
import { UpdateAccountDto } from '@/src/application/identity/account/dto/input/update-account.dto';
import { AccountToDto } from '@/src/application/identity/account/dto/output/account.to-dto';
import { PaginationToDto } from '@/src/application/shared-dto/output/pagination.to-dto';

// UseCases
import { GetAccountUseCase } from '@/src/application/identity/account/use-cases/get-account.use-case';
import { GetAccountListUseCase } from '@/src/application/identity/account/use-cases/get-account-list.use-case';
import { CreateAccountUseCase } from '@/src/application/identity/account/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '@/src/application/identity/account/use-cases/update-account.use-case';
import { DeleteAccountUseCase } from '@/src/application/identity/account/use-cases/delete-account.use-case';

@Controller('account')
export class AccountController {
  constructor(
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly getAccountListUseCase: GetAccountListUseCase,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  /**
   * @description Returns the current account
   */
  @UseGuards(AuthenticateGuard)
  @Get()
  async getAccount(@User() user: Session): Promise<{ account: AccountToDto }> {
    return await this.getAccountUseCase.execute(user.sub);
  }

  /**
   * @description Get accounts
   */
  @UseGuards(AuthenticateGuard, AuthorizeGuard)
  @Authorize(RoleType.ADMIN)
  @Get('list')
  async getAccounts(
    @Query() dto: PaginationQueryDto,
  ): Promise<{ items: AccountToDto[]; meta: PaginationToDto }> {
    return await this.getAccountListUseCase.execute(dto.page, dto.limit);
  }

  /**
   * @description Creates a new account
   */
  @Post()
  async create(
    @Body() dto: CreateAccountDto,
  ): Promise<{ message: string; data: { apikey: string } }> {
    return await this.createAccountUseCase.execute(dto);
  }

  /**
   * @description Update account
   */
  @UseGuards(AuthenticateGuard)
  @Patch()
  async updateAccount(
    @Body() dto: UpdateAccountDto,
    @User() user: Session,
  ): Promise<{ message: string }> {
    return await this.updateAccountUseCase.execute(user.sub, dto);
  }

  /**
   * @description Remove account
   */
  @UseGuards(AuthenticateGuard)
  @Delete()
  async deleteAccount(@User() user: Session) {
    return await this.deleteAccountUseCase.execute(user.sub);
  }
}
