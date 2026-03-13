/**
 * @description Centralized Redis keys
 */
export class RedisKeys {
  // ------------------ Rate Limit ------------------
  static rateLimit(identity: string, path: string): string {
    return `rate:${identity}:${path}`;
  }

  // ------------------ Account ------------------
  static accountById(id: string): string {
    return `account:id:${id}`;
  }

  static accountByDomain(domain: string): string {
    return `account:domain:${domain}`;
  }

  static accountByFolder(folder: string): string {
    return `account:folder:${folder}`;
  }

  static accountByApiKey(apikey: string): string {
    return `account:apikey:${apikey}`;
  }

  // ------------------ Quota ------------------
  static quotaById(id: string): string {
    return `quota:id:${id}`;
  }
  static quotaByAccountId(accountId: string): string {
    return `quota:account:${accountId}`;
  }

  // ------------------ Image ------------------
  static imageById(id: string): string {
    return `image:id:${id}`;
  }

  static imagesByAccountId(accountId: string): string {
    return `image:account:${accountId}`;
  }

  static imageOptimizationById(id: string): string {
    return `image:optimization:${id}`;
  }

  // ------------------ Video ------------------
  static videoById(id: string): string {
    return `video:id:${id}`;
  }

  static videosByAccountId(accountId: string): string {
    return `video:account:${accountId}`;
  }

  static videoTranscodingById(id: string): string {
    return `video:transcoding:${id}`;
  }
}
