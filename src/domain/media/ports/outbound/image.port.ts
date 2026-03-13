import { Image } from '../../entities/image.entity';
import { ImageOptimization } from '@/src/platform/shared/types/image-optimization.type';
import { OptimizationStatusType } from '../../value-objects/optimization-status.vo';

export abstract class ImagePort {
  // ------------------ Image Optimization (Redis) ------------------

  /**
   * Retrieves an optimization task from the temporal store.
   */
  abstract getOptimization(taskId: string): Promise<ImageOptimization | null>;

  /**
   * Persists or updates an optimization task.
   */
  abstract saveOptimization(task: ImageOptimization): Promise<void>;

  /**
   * Updates the status of an optimization task.
   */
  abstract updateOptimizationStatus(
    taskId: string,
    status: OptimizationStatusType,
  ): Promise<void>;

  /**
   * Marks task as processing.
   */
  abstract markOptimizationProcessing(taskId: string): Promise<void>;

  /**
   * Marks task as canceled.
   */
  abstract markOptimizationCanceled(taskId: string): Promise<void>;

  /**
   * Marks task as completed.
   */
  abstract markOptimizationCompleted(taskId: string): Promise<void>;

  /**
   * Removes the optimization task from the store.
   */
  abstract deleteOptimization(taskId: string): Promise<void>;

  // ------------------ Image Persistence (ORM) ------------------

  /**
   * Finds an image by its unique identifier.
   */
  abstract findById(id: string): Promise<Image | null>;

  /**
   * Finds all images associated with an account.
   */
  abstract findByAccountId(accountId: string): Promise<Image[]>;

  /**
   * Finds an image by filename and account.
   */
  abstract findByFilename(
    filename: string,
    accountId: string,
  ): Promise<Image | null>;

  /**
   * Finds images that have expired (temporary status).
   */
  abstract findExpired(batchSize?: number): Promise<Image[]>;

  /**
   * Saves or updates an image entity in the database.
   */
  abstract save(image: Image): Promise<Image>;

  /**
   * Permanently deletes an image.
   */
  abstract delete(id: string): Promise<boolean>;
}
