import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

/**
 * Factory to create a mocked instance of AccountPort.
 * Extending the abstract class ensures prototype compatibility.
 */
export const accountPortMock = (): jest.Mocked<AccountPort> => {
  const mock = new (class extends AccountPort {
    findAll = jest.fn();
    findById = jest.fn();
    findByApiKey = jest.fn();
    findByDomain = jest.fn();
    findByFolder = jest.fn();
    save = jest.fn();
    delete = jest.fn();
  })();

  return mock as jest.Mocked<AccountPort>;
};
