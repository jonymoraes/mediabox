type TimeUnit = 's' | 'm' | 'h' | 'd';

const UNIT_TO_SEC: Record<TimeUnit, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

/**
 * Parses a duration string (e.g., "5s", "10m", "2h", "1d") into seconds
 */
export const parseTimeToSeconds = (input: string): number => {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid time format: ${input}`);

  const value = parseInt(match[1], 10);
  const unit = match[2] as TimeUnit;

  return value * UNIT_TO_SEC[unit];
};

/**
 * Parses a duration string into milliseconds
 */
export const parseTimeToMilliseconds = (input: string): number => {
  return parseTimeToSeconds(input) * 1000;
};
