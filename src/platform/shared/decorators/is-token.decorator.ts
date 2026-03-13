import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

/**
 * Validates that the string is a valid Token (UUID v4).
 */
export function IsToken(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isToken',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          return (
            typeof value === 'string' &&
            uuidValidate(value) &&
            uuidVersion(value) === 4
          );
        },
        defaultMessage(args: ValidationArguments) {
          const key = validationOptions?.message
            ? (validationOptions.message as string)
            : 'shared.validation.is_token';

          return `${args.property}:${key}`;
        },
      },
    });
  };
}
