import { DomainException } from './domain.exceptions';

export class TooManyRequestsException extends DomainException {
  constructor() {
    super('shared.errors.too_many_requests', 429);
    this.name = 'TooManyRequestsException';
  }
}

export class ProcessCanceledException extends DomainException {
  constructor() {
    super('shared.errors.process_canceled', 499);
    this.name = 'ProcessCanceledException';
  }
}

export class FileSystemException extends DomainException {
  constructor() {
    super('shared.errors.file_system_error', 500);
    this.name = 'FileSystemException';
  }
}

export class FileNotFoundException extends DomainException {
  constructor() {
    super('shared.errors.file_not_found', 404);
    this.name = 'FileNotFoundException';
  }
}

export class InvalidFileTypeException extends DomainException {
  constructor() {
    super('shared.errors.invalid_file_type', 400);
    this.name = 'InvalidFileTypeException';
  }
}

/**
 * @description Exception for job status validation (required field)
 */
export class JobStatusRequiredException extends DomainException {
  constructor() {
    super('shared.job_status.errors.required', 400);
    this.name = 'JobStatusRequiredException';
  }
}

export class JobFailedException extends DomainException {
  constructor() {
    super('shared.job_status.errors.failed', 500);
    this.name = 'JobFailedException';
  }
}

export class JobAlreadyCanceledException extends DomainException {
  constructor() {
    super('shared.job_status.errors.alreadyCanceled', 400);
    this.name = 'JobAlreadyCanceledException';
  }
}

export class JobAlreadyFinalizedException extends DomainException {
  constructor() {
    super('shared.job_status.errors.alreadyFinalized', 400);
    this.name = 'JobAlreadyFinalizedException';
  }
}

/**
 * @description Exception for invalid job status values
 */
export class InvalidJobStatusException extends DomainException {
  constructor() {
    super('shared.job_status.errors.invalid', 400);
    this.name = 'InvalidJobStatusException';
  }
}
