import { VideoUploadPayload } from '@/src/adapters/inbound/rest/transformers/video-upload.transformer';

export abstract class VideoUploadPort {
  abstract execute(
    userId: string,
    payload: VideoUploadPayload,
  ): Promise<{ message: string; data: { jobId: string } }>;
}
