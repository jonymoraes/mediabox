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
  ImageUploadTransformer,
  ImageUploadPayload,
} from '../transformers/image-upload.transformer';

// Utils & Constants
import { validateImageUpload } from '@/src/platform/shared/utils/file.util';
import { Context } from '@/src/platform/shared/constants/image.constants';

// Exceptions
import {
  InvalidImageContextException,
  ImageContextRequiredException,
} from '@/src/domain/media/exceptions/image.exceptions';

@Injectable({ scope: Scope.REQUEST })
export class ImageUploadPipe implements PipeTransform {
  constructor(
    @Inject(REQUEST) private readonly req: FastifyRequest,
    private readonly transformer: ImageUploadTransformer,
  ) {}

  async transform(
    _value: any,
    _metadata: ArgumentMetadata,
  ): Promise<ImageUploadPayload> {
    const file = await validateImageUpload(this.req);

    const body = this.req.body as any;
    const rawContext = body?.context?.value?.toLowerCase();
    const validContexts = Object.values(Context) as string[];

    if (!rawContext) throw new ImageContextRequiredException();

    if (!validContexts.includes(rawContext))
      throw new InvalidImageContextException();

    return this.transformer.mapToDomain(file, rawContext as Context);
  }
}
