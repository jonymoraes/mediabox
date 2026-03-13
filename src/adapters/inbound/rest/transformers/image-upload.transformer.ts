import { Injectable } from '@nestjs/common';
import { MultipartFile } from '@fastify/multipart';
import { ImageFile } from '@/src/domain/media/value-objects/image-file.vo';
import { Context } from '@/src/platform/shared/constants/image.constants';

export interface ImageUploadPayload {
  file: ImageFile;
  context: Context;
}

@Injectable()
export class ImageUploadTransformer {
  /**
   * Maps infrastructure MultipartFile to Domain Value Object
   */
  mapToDomain(rawFile: MultipartFile, context: Context): ImageUploadPayload {
    const buffer = (rawFile as any).buffer;

    return {
      file: new ImageFile(
        buffer,
        rawFile.filename,
        rawFile.mimetype,
        buffer.length,
      ),
      context,
    };
  }
}
