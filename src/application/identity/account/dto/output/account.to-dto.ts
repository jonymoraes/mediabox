import { Account } from '@/src/domain/identity/entities/account.entity';
import { QuotaToDto } from '../../../quota/dto/quota.to-dto';

export class AccountToDto {
  id: string;
  name: string;
  domain: string | null;
  folder: string | null;
  storagePath: string | null;
  usedBytes: string;
  role: string;
  status: string;
  quota: QuotaToDto[];
  createdAt?: Date;
  updatedAt?: Date;

  static fromDomain(account: Account): AccountToDto {
    const dto = new AccountToDto();
    const props = account.unpack();

    dto.id = props.id;
    dto.name = props.name;
    dto.domain = props.domain ?? null;
    dto.folder = props.folder ?? null;
    dto.storagePath = props.storagePath ?? null;
    dto.usedBytes = props.usedBytes.toString();
    dto.role = props.role.value;
    dto.status = props.apikey.status.value;
    dto.createdAt = props.createdAt;
    dto.updatedAt = props.updatedAt;

    dto.quota = props.quotas
      ? props.quotas.map((quota) => QuotaToDto.fromEntity(quota))
      : [];

    return dto;
  }
}
