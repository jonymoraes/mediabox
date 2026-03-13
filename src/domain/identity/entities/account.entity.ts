import { Role } from '../value-objects/role.vo';
import { ApiKey } from '../value-objects/api-key.vo';
import { ApiKeyStatus } from '../value-objects/api-key-status.vo';
import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';
import { HttpStatus } from '@nestjs/common';
import { generateFolderPath } from '@/src/platform/shared/utils/file.util';
import { Quota } from './quota.entity';

export interface AccountProps {
  id: string;
  apikey: ApiKey;
  name: string;
  domain?: string | null;
  folder?: string | null;
  storagePath?: string | null;
  usedBytes: bigint;
  role: Role;
  quotas?: Quota[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Account {
  private readonly _id: string;
  private _apikey: ApiKey;
  private _name: string;
  private _domain: string | null;
  private _folder: string | null;
  private _storagePath: string | null;
  private _usedBytes: bigint;
  private _role: Role;
  private _quotas: Quota[];
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(props: AccountProps) {
    this._id = props.id;
    this._apikey = props.apikey;
    this._name = props.name;
    this._domain = props.domain ?? null;
    this._folder = props.folder ?? null;
    this._storagePath = props.storagePath ?? null;
    this._usedBytes = props.usedBytes;
    this._role = props.role;
    this._quotas = props.quotas ?? [];
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: {
    name: string;
    role: Role;
    apikey?: string;
    domain?: string;
  }): Account {
    const apikey = props.apikey
      ? ApiKey.create(props.apikey)
      : ApiKey.generate();

    let folder: string | null = null;
    let storagePath: string | null = null;

    if (props.domain !== undefined && props.domain !== null) {
      const generated = generateFolderPath(props.domain);

      if (!generated.folder || generated.folder.length === 0) {
        throw new DomainException(
          'identity.account.errors.invalid_domain',
          HttpStatus.BAD_REQUEST,
        );
      }

      folder = generated.folder;
      storagePath = generated.storagePath;
    }

    return new Account({
      id: '',
      apikey,
      name: props.name,
      domain: props.domain,
      folder,
      storagePath,
      usedBytes: BigInt(0),
      role: props.role,
      quotas: [],
    });
  }

  public static load(props: AccountProps): Account {
    return new Account(props);
  }

  get id(): string {
    return this._id;
  }

  get apikey(): ApiKey {
    return this._apikey;
  }

  get name(): string {
    return this._name;
  }

  get domain(): string | null {
    return this._domain;
  }

  get folder(): string | null {
    return this._folder;
  }

  get storagePath(): string | null {
    return this._storagePath;
  }

  get usedBytes(): bigint {
    return this._usedBytes;
  }

  get role(): Role {
    return this._role;
  }

  get quotas(): Quota[] {
    return this._quotas;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  public isActive(): boolean {
    return this._apikey.isActive();
  }

  public isAdmin(): boolean {
    return this._role.isAdmin();
  }

  /**
   * Increments the used bytes storage.
   */
  public addUsedBytes(bytes: bigint): void {
    if (bytes < BigInt(0)) {
      throw new DomainException(
        'identity.account.storage.errors.invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
    this._usedBytes += bytes;
  }

  public updateStorageUsage(bytes: bigint): void {
    if (bytes < BigInt(0)) {
      throw new DomainException(
        'identity.account.storage.errors.invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
    this._usedBytes = bytes;
  }

  public changeStatus(newStatus: ApiKeyStatus): void {
    this._apikey = this._apikey.withStatus(newStatus);
  }

  public updateName(name: string): void {
    this._name = name;
  }

  public changeDomain(domain: string): {
    oldPath: string | null;
    newPath: string | null;
  } {
    const oldPath = this._storagePath;
    const { folder, storagePath } = generateFolderPath(domain);

    if (!folder || folder.length === 0) {
      throw new DomainException(
        'identity.account.errors.invalid_domain',
        HttpStatus.BAD_REQUEST,
      );
    }

    this._domain = domain;
    this._folder = folder;
    this._storagePath = storagePath;

    return { oldPath, newPath: storagePath };
  }

  public unpack(): AccountProps {
    return {
      id: this._id,
      apikey: this._apikey,
      name: this._name,
      domain: this._domain,
      folder: this._folder,
      storagePath: this._storagePath,
      usedBytes: this._usedBytes,
      role: this._role,
      quotas: this._quotas,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
