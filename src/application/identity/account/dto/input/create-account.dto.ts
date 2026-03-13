import { IsNotEmpty, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * @description DTO for creating an Account
 */
export class CreateAccountDto {
  @IsNotEmpty({
    message: i18nValidationMessage('identity.account.errors.name_required'),
  })
  @MaxLength(100, {
    message: i18nValidationMessage('identity.account.errors.name_too_long'),
  })
  name: string;

  @IsNotEmpty({
    message: i18nValidationMessage('identity.account.errors.domain_required'),
  })
  @MaxLength(100, {
    message: i18nValidationMessage('identity.account.errors.domain_too_long'),
  })
  domain: string;
}
