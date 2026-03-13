import { Quota } from '@/src/domain/identity/entities/quota.entity';

export class QuotaToDto {
  id: string;
  accountId: string;
  transferredBytes: number;
  totalRequests: number;
  lastResetAt: Date;
  createdAt?: Date;
  updatedAt?: Date;

  /**
   * @description Map Quota entity to DTO
   */
  static fromEntity(quota: Quota): QuotaToDto {
    const dto = new QuotaToDto();

    dto.id = quota.id;
    dto.accountId = quota.accountId;
    dto.transferredBytes = Number(quota.transferredBytes);
    dto.totalRequests = quota.totalRequests;
    dto.lastResetAt = quota.lastResetAt;

    dto.createdAt = quota.createdAt;
    dto.updatedAt = quota.updatedAt;

    return dto;
  }
}
