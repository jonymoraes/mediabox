import { Injectable } from '@nestjs/common';
import { MultipartFile } from '@fastify/multipart';
import { VideoFile } from '@/src/domain/media/value-objects/video-file.vo';
import { Format } from '@/src/platform/shared/constants/video.constants';

export interface VideoUploadPayload {
  file: VideoFile;
  format: Format;
}

@Injectable()
export class VideoUploadTransformer {
  /**
   * Maps infrastructure MultipartFile to Domain Value Object
   */
  mapToDomain(rawFile: MultipartFile, format: Format): VideoUploadPayload {
    const buffer = (rawFile as any).buffer;

    return {
      file: new VideoFile(
        buffer,
        rawFile.filename,
        rawFile.mimetype,
        buffer.length,
      ),
      format,
    };
  }
}
