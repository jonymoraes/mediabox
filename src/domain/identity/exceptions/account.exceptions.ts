import { DomainException } from '../../shared/exceptions/domain.exceptions';

export class AccountNotFoundException extends DomainException {
  constructor() {
    super('identity.account.errors.not_found', 404);
    this.name = 'AccountNotFoundException';
  }
}

export class AccountAlreadyExistsException extends DomainException {
  constructor() {
    super('identity.account.errors.already_exists', 409);
    this.name = 'AccountAlreadyExistsException';
  }
}

export class AccountBannedException extends DomainException {
  constructor() {
    super('identity.account.errors.is_banned', 403);
    this.name = 'AccountBannedException';
  }
}

export class NotAuthorizedException extends DomainException {
  constructor() {
    super('identity.auth.errors.not_authorized', 403);
    this.name = 'NotAuthorizedException';
  }
}

export class InvalidTokenException extends DomainException {
  constructor() {
    super('identity.auth.errors.invalid_token', 401);
    this.name = 'InvalidTokenException';
  }
}
