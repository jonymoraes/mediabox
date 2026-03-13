import { ValueTransformer } from 'typeorm';
import { Role } from '@/src/domain/identity/value-objects/role.vo';

/**
 * Transformer for Role Value Object.
 * Responsibility: Handles infrastructure-specific serialization and rehydration.
 */
export class RoleTransformer implements ValueTransformer {
  /**
   * Persists the Value Object as a primitive string.
   */
  public to(vo: Role | undefined): string | undefined {
    return vo?.value;
  }

  /**
   * Rehydrates the Role Value Object.
   */
  public from(value: any): Role | undefined {
    if (value === null || value === undefined) return undefined;
    const rawValue =
      value && typeof value === 'object' ? value._value || value.value : value;

    return Role.fromString(rawValue);
  }
}
