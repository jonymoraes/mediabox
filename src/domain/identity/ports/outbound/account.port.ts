import {
  Account,
  AccountProps,
} from '@/src/domain/identity/entities/account.entity';

export abstract class AccountPort {
  /**
   * Finds accounts and total count in a single operation.
   * Useful for paginated views.
   */
  abstract findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: keyof AccountProps;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<[Account[], number]>;

  /**
   * Finds an account by its unique identifier.
   */
  abstract findById(id: string): Promise<Account | null>;

  /**
   * Finds an account by its API key.
   */
  abstract findByApiKey(apikey: string): Promise<Account | null>;

  /**
   * Finds an account by its assigned domain.
   */
  abstract findByDomain(domain: string): Promise<Account | null>;

  /**
   * Finds an account by its storage/identifier folder.
   */
  abstract findByFolder(folder: string): Promise<Account | null>;

  /**
   * Persists an account entity (create or update).
   */
  abstract save(account: Account): Promise<Account>;

  /**
   * Removes an account from the system by id.
   */
  abstract delete(id: string): Promise<boolean>;
}
