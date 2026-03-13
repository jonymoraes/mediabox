import { QuotaToDto } from '@/src/application/identity/quota/dto/quota.to-dto';

/**
 * @description Inbound port for getting a quota by ID
 */
export abstract class GetQuotaPort {
  /**
   * @description Get quota by ID
   * @param id Quota id
   */
  abstract execute(id: string): Promise<{ quota: QuotaToDto }>;
}
