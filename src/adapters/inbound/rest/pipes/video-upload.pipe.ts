import {
  PipeTransform,
  Injectable,
  Inject,
  Scope,
  ArgumentMetadata,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

// Transformers & Payloads
import {
  VideoUploadTransformer,
  VideoUploadPayload,
} from '../transformers/video-upload.transformer';

// Utils & Constants
import { validateVideoUpload } from '@/src/platform/shared/utils/file.util';
import { Format } from '@/src/platform/shared/constants/video.constants';

// Exceptions
import {
  InvalidVideoFormatException,
  VideoFormatRequiredException,
} from '@/src/domain/media/exceptions/video.exceptions';

@Injectable({ scope: Scope.REQUEST })
export class VideoUploadPipe implements PipeTransform {
  constructor(
    @Inject(REQUEST) private readonly req: FastifyRequest,
    private readonly transformer: VideoUploadTransformer,
  ) {}

  async transform(
    _value: any,
    _metadata: ArgumentMetadata,
  ): Promise<VideoUploadPayload> {
    const file = await validateVideoUpload(this.req);

    const body = this.req.body as any;
    const rawFormat = body?.format?.value?.toLowerCase();
    const validFormats = Object.values(Format) as string[];

    if (!rawFormat) {
      throw new VideoFormatRequiredException();
    }

    if (!validFormats.includes(rawFormat)) {
      throw new InvalidVideoFormatException();
    }

    return this.transformer.mapToDomain(file, rawFormat as Format);
  }
}
