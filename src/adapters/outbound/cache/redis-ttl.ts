/**
 * @description Centralized Redis TTLs (in seconds)
 */
export class RedisTTL {
  static readonly RATE_LIMIT = 60; // 1 minute

  // -------------------- Identity -----------------------
  static readonly ACCOUNT = 300; // 5 minutes
  static readonly QUOTA = 300; // 5 minutes

  // -------------------- Media --------------------------
  static readonly IMAGE = 300; // 5 minutes
  static readonly VIDEO = 300; // 5 minutes

  // -------------------- Jobs (BullMQ) ------------------
  static readonly IMAGE_JOB = 3600; // 60 minutes
  static readonly VIDEO_JOB = 7200; // 2 hours
}
