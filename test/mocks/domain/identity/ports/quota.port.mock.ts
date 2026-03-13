import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

/**
 * Factory to create a mocked instance of QuotaPort.
 * Extending the abstract class ensures prototype compatibility.
 */
export const quotaPortMock = (): jest.Mocked<QuotaPort> => {
  const mock = new (class extends QuotaPort {
    findById = jest.fn();
    findByAccountId = jest.fn();
    save = jest.fn();
    delete = jest.fn();
  })();

  return mock as jest.Mocked<QuotaPort>;
};
