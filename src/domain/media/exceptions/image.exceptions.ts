import { DomainException } from '../../shared/exceptions/domain.exceptions';

export class ImageTransformException extends DomainException {
  constructor() {
    super('media.image.errors.transform_failed', 422);
    this.name = 'ImageTransformException';
  }
}

export class InvalidImageException extends DomainException {
  constructor() {
    super('media.image.errors.invalid', 400);
    this.name = 'InvalidImageException';
  }
}

export class InvalidImageContextException extends DomainException {
  constructor() {
    super('media.image.errors.invalid_context', 400);
    this.name = 'InvalidImageContextException';
  }
}

export class ImageContextRequiredException extends DomainException {
  constructor() {
    super('media.image.errors.empty_context', 400);
    this.name = 'ImageContextRequiredException';
  }
}

export class InvalidImagePathException extends DomainException {
  constructor() {
    super('media.image.errors.invalid_path', 400);
    this.name = 'InvalidImagePathException';
  }
}

export class ImageRequiredException extends DomainException {
  constructor() {
    super('media.image.errors.required', 400);
    this.name = 'ImageRequiredException';
  }
}

export class InvalidImageFormatException extends DomainException {
  constructor() {
    super('media.image.errors.invalid_format', 400);
    this.name = 'InvalidImageFormatException';
  }
}

export class ImageTooLargeException extends DomainException {
  constructor() {
    super('media.image.errors.too_large', 400);
    this.name = 'ImageTooLargeException';
  }
}
