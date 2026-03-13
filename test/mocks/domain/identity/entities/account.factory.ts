import { Role } from '@/src/domain/identity/value-objects/role.vo';
import {
  Account,
  AccountProps,
} from '@/src/domain/identity/entities/account.entity';
import { ApiKeyFactory } from '../value-objects/api-key.factory';
import { RoleFactory } from '../value-objects/role.factory';

export class AccountFactory {
  /**
   * Creates an Account using the domain logic (create static method).
   * Generates folder and storagePath automatically via domain rules.
   */
  public static create(
    props: {
      name?: string;
      domain?: string;
      role?: Role;
    } = {},
  ): Account {
    return Account.create({
      name: props.name ?? 'Test Account',
      domain: props.domain ?? 'test.com',
      role: props.role ?? RoleFactory.user(),
    });
  }

  /**
   * Loads a full Account instance bypassing domain rules.
   * Internal properties are mapped directly to props.
   */
  public static load(partial: Partial<AccountProps> = {}): Account {
    const defaultProps: AccountProps = {
      id: partial.id ?? '550e8400-e29b-41d4-a716-446655440000',
      apikey: partial.apikey ?? ApiKeyFactory.random(),
      name: partial.name ?? 'Loaded Account',
      domain: partial.hasOwnProperty('domain') ? partial.domain : 'loaded.com',
      folder: partial.hasOwnProperty('folder') ? partial.folder : 'loaded_com',
      storagePath: partial.hasOwnProperty('storagePath')
        ? partial.storagePath
        : '/storage/loaded_com',
      usedBytes: partial.usedBytes ?? BigInt(0),
      role: partial.role ?? RoleFactory.user(),
      createdAt: partial.createdAt ?? new Date(),
      updatedAt: partial.updatedAt ?? new Date(),
    };

    return Account.load(defaultProps);
  }

  /**
   * Creates an admin account for testing authorization.
   */
  public static admin(): Account {
    return this.create({ role: RoleFactory.admin() });
  }
}
