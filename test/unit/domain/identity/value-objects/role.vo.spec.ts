import { Role, RoleType } from 'src/domain/identity/value-objects/role.vo';
import { expectDomainException } from '../../shared/exceptions/expect-domain-exception';

describe('Role Value Object', () => {
  it('should create an admin role using static method', () => {
    const role = Role.admin();
    expect(role.value).toBe(RoleType.ADMIN);
    expect(role.isAdmin()).toBe(true);
  });

  it('should create a user role using static method', () => {
    const role = Role.user();
    expect(role.value).toBe(RoleType.USER);
    expect(role.isAdmin()).toBe(false);
  });

  it('should create a role from string', () => {
    const role = Role.fromString('user');
    expect(role.value).toBe(RoleType.USER);
  });

  it('should be case insensitive', () => {
    const role = Role.fromString('ADMIN');
    expect(role.value).toBe(RoleType.ADMIN);
  });

  it('should fail when string is empty', () => {
    expectDomainException(
      () => Role.fromString(''),
      'identity.auth.errors.invalid_role',
    );
  });

  it('should fail when role does not exist', () => {
    expectDomainException(
      () => Role.fromString('superadmin'),
      'identity.auth.errors.invalid_role',
    );
  });

  it('should return true if roles are equal', () => {
    const role1 = Role.user();
    const role2 = Role.fromString('user');
    expect(role1.equals(role2)).toBe(true);
  });

  it('should return string representation', () => {
    const role = Role.admin();
    expect(role.toString()).toBe('Admin');
  });
});
