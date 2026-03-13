import { DomainException } from '../../shared/exceptions/domain.exceptions';

export class QuotaNotFoundException extends DomainException {
  constructor() {
    super('identity.quota.errors.not_found', 404);
    this.name = 'QuotaNotFoundException';
  }
}
