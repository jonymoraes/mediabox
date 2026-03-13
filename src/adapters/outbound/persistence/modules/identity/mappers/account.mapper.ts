import { Account as AccountOrm } from '../entities/account.entity-orm';
import { Account as AccountDomain } from '@/src/domain/identity/entities/account.entity';
import { ApiKey } from '@/src/domain/identity/value-objects/api-key.vo';
import { ApiKeyStatus } from '@/src/domain/identity/value-objects/api-key-status.vo';
import { Role } from '@/src/domain/identity/value-objects/role.vo';
import { QuotaMapper } from './quota.mapper';

/**
 * Mapper for Account entity between Domain and Persistence layers.
 */
export class AccountMapper {
  /**
   * Maps ORM entity to Domain entity.
   */
  public static toDomain(orm: AccountOrm): AccountDomain {
    const rawStatus =
      orm.status && typeof orm.status === 'object'
        ? (orm.status as any).value
        : orm.status;

    const rawRole =
      orm.role && typeof orm.role === 'object'
        ? (orm.role as any).value || (orm.role as any)._value
        : orm.role;

    const status = ApiKeyStatus.fromString(rawStatus);
    const role = Role.fromString(rawRole);
    const apikey = ApiKey.create(orm.apikey, status);

    const quotas = orm.quotas
      ? orm.quotas.map((q) => QuotaMapper.toDomain(q))
      : [];

    return AccountDomain.load({
      ...orm,
      apikey,
      role,
      quotas,
      usedBytes: BigInt(orm.usedBytes || 0),
    });
  }

  /**
   * Maps Domain entity to Persistence object.
   */
  public static toPersistence(domain: AccountDomain): Partial<AccountOrm> {
    const data = domain.unpack();

    return {
      ...(data.id && { id: data.id }),
      apikey: data.apikey.value,
      status: data.apikey.status as any,
      role: data.role as any,
      name: data.name,
      domain: data.domain ?? undefined,
      folder: data.folder ?? undefined,
      storagePath: data.storagePath ?? undefined,
      usedBytes: data.usedBytes.toString(),
      ...(data.quotas && {
        quota: data.quotas.map((q) => QuotaMapper.toPersistence(q)) as any,
      }),
    };
  }
}
