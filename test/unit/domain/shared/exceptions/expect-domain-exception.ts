import { DomainException } from '@/src/domain/shared/exceptions/domain.exceptions';

/**
 * Versión síncrona (Mantenela igual para no romper tus 43 suites)
 */
export const expectDomainException = (
  fn: () => any,
  expectedKey: string,
): void => {
  let thrownError: any;
  try {
    fn();
  } catch (error) {
    thrownError = error;
  }

  if (!thrownError) {
    throw new Error(
      `Expected DomainException with key "${expectedKey}" but no error was thrown.`,
    );
  }

  expect(thrownError).toBeInstanceOf(DomainException);
  expect(thrownError.key).toBe(expectedKey);
};

/**
 * Nueva versión asíncrona para Use Cases
 */
export const expectDomainExceptionAsync = async (
  fn: () => Promise<any>,
  expectedKey: string,
  expectedStatus?: number,
): Promise<void> => {
  let thrownError: any;
  try {
    await fn();
  } catch (error) {
    thrownError = error;
  }

  if (!thrownError) {
    throw new Error(
      `Expected DomainException with key "${expectedKey}" but no error was thrown.`,
    );
  }

  expect(thrownError).toBeInstanceOf(DomainException);
  expect(thrownError.key).toBe(expectedKey);
  if (expectedStatus) expect(thrownError.status).toBe(expectedStatus);
};
