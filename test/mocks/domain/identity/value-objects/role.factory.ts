import { Role, RoleType } from '@/src/domain/identity/value-objects/role.vo';

export class RoleFactory {
  /**
   * Creates a Role instance for testing purposes.
   * Defaults to USER if no type is provided.
   */
  public static create(type: RoleType = RoleType.USER): Role {
    return type === RoleType.ADMIN ? Role.admin() : Role.user();
  }

  /**
   * Generates a random role instance.
   */
  public static random(): Role {
    const types = Object.values(RoleType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return this.create(randomType as RoleType);
  }

  /**
   * Convenience method to get an Admin role.
   */
  public static admin(): Role {
    return Role.admin();
  }

  /**
   * Convenience method to get a User role.
   */
  public static user(): Role {
    return Role.user();
  }
}
