import { ImageUploadPayload } from '@/src/adapters/inbound/rest/transformers/image-upload.transformer';

export abstract class ImageUploadPort {
  abstract execute(
    userId: string,
    payload: ImageUploadPayload,
  ): Promise<{ message: string; data: { jobId: string } }>;
}
