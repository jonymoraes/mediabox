import { ArgumentsHost, Catch, Injectable } from '@nestjs/common';
import {
  I18nValidationExceptionFilter,
  I18nValidationException,
} from 'nestjs-i18n';
import { ValidationError } from 'class-validator';

@Catch(I18nValidationException)
@Injectable()
export class I18nValidationFilter extends I18nValidationExceptionFilter {
  constructor() {
    super({
      errorFormatter: (errors: ValidationError[]) => {
        const formattedErrors: Record<string, string> = {};
        errors.forEach((error) => {
          const constraints = error.constraints;
          if (constraints) {
            const firstKey = Object.keys(constraints)[0];
            let message = constraints[firstKey];
            message = message.replace(`${error.property}: `, '').trim();
            formattedErrors[error.property] = message;
          }
        });
        return { errors: formattedErrors };
      },
    });
  }

  catch(exception: any, host: ArgumentsHost) {
    return super.catch(exception, host);
  }
}
