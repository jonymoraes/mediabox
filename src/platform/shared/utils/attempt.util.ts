/**
 * @description Attempt to execute a function and return the result or a fallback value if an error occurs
 * @param fn Function to execute
 * @param fallback Fallback value
 * @returns Result of the function or the fallback value
 */
export function attempt<T>(fn: () => T, fallback?: T): T | null {
  try {
    return fn();
  } catch {
    return fallback ?? null;
  }
}
