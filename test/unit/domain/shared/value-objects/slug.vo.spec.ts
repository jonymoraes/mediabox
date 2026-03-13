import { Slug } from 'src/domain/shared/value-objects/slug.vo';
import { expectDomainException } from 'test/unit/domain/shared/exceptions/expect-domain-exception';

describe('Slug Value Object', () => {
  describe('fromString', () => {
    it('should create a slug instance from a valid string', () => {
      const rawValue = 'some-valid-slug';
      const slug = Slug.fromString(rawValue);
      expect(slug.value).toBe(rawValue);
    });

    it('should trim whitespace from the input string', () => {
      const slug = Slug.fromString('  trimmed-slug  ');
      expect(slug.value).toBe('trimmed-slug');
    });

    it('should fail when string is empty', () => {
      expectDomainException(
        () => Slug.fromString(''),
        'shared.validation.slug_required',
      );
    });

    it('should fail when string is null or undefined', () => {
      expectDomainException(
        () => Slug.fromString(null as any),
        'shared.validation.slug_required',
      );
      expectDomainException(
        () => Slug.fromString(undefined as any),
        'shared.validation.slug_required',
      );
    });
  });

  describe('create (Generation)', () => {
    it('should generate a slugified version of the name', () => {
      const slug = Slug.create('Modern Electronics Store');
      expect(slug.value).toBe('modern-electronics-store');
    });

    it('should append index if it is greater than zero', () => {
      const slug = Slug.create('Gadget', 5);
      expect(slug.value).toBe('gadget-5');
    });

    it('should not append index if it is zero', () => {
      const slug = Slug.create('Gadget', 0);
      expect(slug.value).toBe('gadget');
    });

    it('should fail when name is empty', () => {
      expectDomainException(
        () => Slug.create('   '),
        'shared.validation.slug_required',
      );
    });

    it('should fail when generated slug is too short', () => {
      expectDomainException(
        () => Slug.create('A'),
        'shared.validation.slug_too_short',
      );
    });
  });

  describe('Utility Methods', () => {
    it('should identify equal slugs', () => {
      const slug1 = Slug.fromString('equal-slug');
      const slug2 = Slug.fromString('equal-slug');
      const slug3 = Slug.fromString('different');

      expect(slug1.equals(slug2)).toBe(true);
      expect(slug1.equals(slug3)).toBe(false);
    });

    it('should return raw value when calling toRaw or toString', () => {
      const value = 'standard-slug';
      const slug = Slug.fromString(value);

      expect(slug.toRaw()).toBe(value);
      expect(slug.toString()).toBe(value);
    });
  });
});
