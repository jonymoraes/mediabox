import { Slug } from 'src/domain/shared/value-objects/slug.vo';

export class SlugFactory {
  /**
   * Creates a Slug Value Object for testing.
   * Defaults to 'test-slug'.
   */
  public static create(value = 'test-slug'): Slug {
    return Slug.fromString(value);
  }

  /**
   * Creates a Slug using the generation logic (slugify).
   * Useful when testing entities that generate their slug from a name.
   */
  public static fromName(name = 'Test Name', index = 0): Slug {
    return Slug.create(name, index);
  }

  /**
   * Returns a standard valid slug instance.
   */
  public static random(): Slug {
    return Slug.fromString(`random-slug-${Math.floor(Math.random() * 1000)}`);
  }
}
