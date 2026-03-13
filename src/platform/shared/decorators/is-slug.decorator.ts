import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Slug } from '@/src/domain/shared/value-objects/slug.vo';

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSlug',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          if (!value) return false;
          try {
            Slug.fromString(value);
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const key = validationOptions?.message
            ? (validationOptions.message as string)
            : 'shared.validation.invalid_slug';

          return `${args.property}:${key}`;
        },
      },
    });
  };
}
