import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class DeleteAccountPort {
  /**
   * @description Executes account deletion by id
   * @param id Account id (UUID)
   */
  abstract execute(id: string): Promise<{ message: string }>;
}
