import { IsOptional, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * @description DTO for updating an Account
 */
export class UpdateAccountDto {
  @IsOptional()
  @MaxLength(100, {
    message: i18nValidationMessage('identity.account.errors.name_too_long'),
  })
  name?: string;

  @IsOptional()
  @MaxLength(100, {
    message: i18nValidationMessage('identity.account.errors.domain_too_long'),
  })
  domain?: string;
}
