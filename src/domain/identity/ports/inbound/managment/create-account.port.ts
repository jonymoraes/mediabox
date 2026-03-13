import { CreateAccountDto } from '@/src/application/identity/account/dto/input/create-account.dto';

/**
 * @description Inbound port for creating accounts
 * Defines the interface that the UseCase must implement
 */
export abstract class CreateAccountPort {
  /**
   * @description Executes account creation and returns the created account DTO
   * @param dto CreateAccountDto
   */
  abstract execute(
    dto: CreateAccountDto,
  ): Promise<{ message: string; data: { apikey: string } }>;
}
