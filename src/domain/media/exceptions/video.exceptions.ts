import { DomainException } from '../../shared/exceptions/domain.exceptions';

export class VideoTranscodeException extends DomainException {
  constructor() {
    super('media.video.errors.transcode_failed', 422);
    this.name = 'VideoTranscodeException';
  }
}

export class VideoMetadataException extends DomainException {
  constructor() {
    super('media.video.errors.metadata_failed', 400);
    this.name = 'VideoMetadataException';
  }
}

export class VideoRequiredException extends DomainException {
  constructor() {
    super('media.video.errors.required', 400);
    this.name = 'VideoRequiredException';
  }
}

export class InvalidVideoException extends DomainException {
  constructor() {
    super('media.video.errors.invalid', 400);
    this.name = 'InvalidVideoException';
  }
}

export class InvalidVideoFormatException extends DomainException {
  constructor() {
    super('media.video.errors.invalid_format', 400);
    this.name = 'InvalidVideoFormatException';
  }
}

export class VideoFormatRequiredException extends DomainException {
  constructor() {
    super('media.video.errors.empty_format', 400);
    this.name = 'InvalidVideoFormatRequiredException';
  }
}

export class VideoTooLargeException extends DomainException {
  constructor() {
    super('media.video.errors.too_large', 400);
    this.name = 'VideoTooLargeException';
  }
}
