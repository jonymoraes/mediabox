/**
 * Normalizes a date to UTC at 00:00:00
 */
export const getUtcDateOnly = (date: Date): Date => {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

/**
 * Returns the difference in full days between two dates (UTC)
 */
export const diffDays = (from: Date, to: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(
    (getUtcDateOnly(to).getTime() - getUtcDateOnly(from).getTime()) / msPerDay,
  );
};

/**
 * Formats a date to YYYY-MM-DD (UTC)
 */
export const toDateKey = (date: Date): string => {
  return getUtcDateOnly(date).toISOString().slice(0, 10);
};

/**
 * Returns the current month in YYYY-MM format (UTC)
 */
export const currentMonth = (date: Date = new Date()): string => {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

/**
 * Adds or subtracts days from a Date object
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

/**
 * Checks if a date is in the past compared to today (UTC)
 */
export const isPast = (date: Date): boolean => {
  const today = getUtcDateOnly(new Date());
  const target = getUtcDateOnly(date);
  return target.getTime() < today.getTime();
};
