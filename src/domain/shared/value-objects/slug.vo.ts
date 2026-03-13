import { slugify } from 'src/platform/shared/utils/naming.util';
import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';

export class Slug {
  private constructor(public readonly value: string) {}

  public static fromString(value: string | null | undefined): Slug {
    if (!value || value.trim().length === 0) {
      throw new DomainException('shared.validation.slug_required');
    }
    return new Slug(value.trim());
  }

  public static create(name: string, index: number = 0): Slug {
    if (!name || name.trim().length === 0) {
      throw new DomainException('shared.validation.slug_required');
    }

    const base = slugify(name);
    const finalValue = index > 0 ? `${base}-${index}` : base;

    if (finalValue.length < 3) {
      throw new DomainException('shared.validation.slug_too_short');
    }

    return new Slug(finalValue);
  }

  public equals(other: Slug): boolean {
    return this.value === other.value;
  }

  public toRaw(): string {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }
}
