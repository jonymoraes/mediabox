import { Video } from '../../entities/video.entity';
import { VideoTranscoding } from '@/src/platform/shared/types/video-transcoding.type';
import { TranscodingStatusType } from '../../value-objects/transcoding-status.vo';

export abstract class VideoPort {
  // ------------------ Video Transcoding (Redis) ------------------

  /**
   * Retrieves transcoding metadata by taskId.
   */
  abstract getTranscoding(taskId: string): Promise<VideoTranscoding | null>;

  /**
   * Saves or updates transcoding metadata.
   */
  abstract saveTranscoding(task: VideoTranscoding): Promise<void>;

  /**
   * Updates only the status of a transcoding task.
   */
  abstract updateTranscodingStatus(
    taskId: string,
    status: TranscodingStatusType,
  ): Promise<void>;

  abstract markTranscodingProcessing(taskId: string): Promise<void>;

  abstract markTranscodingCanceled(taskId: string): Promise<void>;

  abstract markTranscodingCompleted(taskId: string): Promise<void>;

  /**
   * Removes transcoding metadata from the temporal store.
   */
  abstract deleteTranscoding(taskId: string): Promise<void>;

  // ------------------ Video Persistence (ORM) ------------------

  /**
   * Finds a video by its unique ID.
   */
  abstract findById(id: string): Promise<Video | null>;

  /**
   * Finds all videos belonging to an account.
   */
  abstract findByAccountId(accountId: string): Promise<Video[]>;

  /**
   * Finds a specific video by filename and owner.
   */
  abstract findByFilename(
    filename: string,
    accountId: string,
  ): Promise<Video | null>;

  /**
   * Finds temporary videos that have passed their expiration date.
   */
  abstract findExpired(batchSize?: number): Promise<Video[]>;

  /**
   * Persists the video entity.
   */
  abstract save(video: Video): Promise<Video>;

  /**
   * Performs a hard delete of the video record.
   */
  abstract delete(id: string): Promise<boolean>;
}
