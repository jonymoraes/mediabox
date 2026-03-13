import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';

/**
 * Factory to create a mocked instance of ImagePort.
 * Extending the abstract class ensures prototype compatibility.
 */
export const imagePortMock = (): jest.Mocked<ImagePort> => {
  const mock = new (class extends ImagePort {
    // Optimization (Redis)
    getOptimization = jest.fn();
    saveOptimization = jest.fn();
    updateOptimizationStatus = jest.fn();
    markOptimizationProcessing = jest.fn();
    markOptimizationCanceled = jest.fn();
    markOptimizationCompleted = jest.fn();
    deleteOptimization = jest.fn();

    // Persistence (ORM)
    findById = jest.fn();
    findByAccountId = jest.fn();
    findByFilename = jest.fn();
    findExpired = jest.fn();
    save = jest.fn();
    delete = jest.fn();
  })();

  return mock as jest.Mocked<ImagePort>;
};
