import { Injectable } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities & Mapper
import { Image as ImageOrm } from '../entities/image.entity-orm';
import { Image as ImageDomain } from '@/src/domain/media/entities/image.entity';
import { ImageMapper } from '../mappers/image.mapper';

// Ports
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';
import { RedisPort } from '@/src/domain/shared/ports/redis.port';

// Cache
import { RedisKeys } from '@/src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from '@/src/adapters/outbound/cache/redis-ttl';

// Domain / Value Objects & Types
import { MediaStatusType } from '@/src/domain/media/value-objects/media-status.vo';
import { ImageOptimization } from '@/src/platform/shared/types/image-optimization.type';
import { OptimizationStatusType } from '@/src/domain/media/value-objects/optimization-status.vo';

// Transformers
import { OptimizationStatusTransformer } from '../transformers/optimization-status.transformer';

@Injectable()
export class ImageRepository extends ImagePort {
  constructor(
    @InjectRepository(ImageOrm)
    private readonly repo: Repository<ImageOrm>,
    private readonly redis: RedisPort,
  ) {
    super();
  }

  // ------------------ Image Optimization (Redis) ------------------

  /**
   * Finds image optimization task by id with cache.
   */
  public async getOptimization(
    taskId: string,
  ): Promise<ImageOptimization | null> {
    const data = await this.redis.get<any>(
      RedisKeys.imageOptimizationById(taskId),
    );

    if (!data) return null;

    return {
      ...data,
      status: OptimizationStatusTransformer.from(data.status),
    };
  }

  /**
   * Saves image optimization task metadata.
   */
  public async saveOptimization(task: ImageOptimization): Promise<void> {
    const persistenceData = {
      ...task,
      status: OptimizationStatusTransformer.to(task.status),
    };

    await this.redis.set(
      RedisKeys.imageOptimizationById(task.taskId),
      persistenceData,
      RedisTTL.IMAGE_JOB,
    );
  }

  /**
   * Generic status update for optimization tasks using Transformer.
   */
  public async updateOptimizationStatus(
    taskId: string,
    status: OptimizationStatusType,
  ): Promise<void> {
    const task = await this.getOptimization(taskId);
    if (!task) return;

    // Update status using the Value Object instance
    task.status = OptimizationStatusTransformer.from(status);

    await this.saveOptimization(task);
  }

  /**
   * Mark as processing.
   */
  public async markOptimizationProcessing(taskId: string): Promise<void> {
    await this.updateOptimizationStatus(
      taskId,
      OptimizationStatusType.PROCESSING,
    );
  }

  /**
   * Mark as canceled.
   */
  public async markOptimizationCanceled(taskId: string): Promise<void> {
    await this.updateOptimizationStatus(
      taskId,
      OptimizationStatusType.CANCELED,
    );
  }

  /**
   * Mark as completed.
   */
  public async markOptimizationCompleted(taskId: string): Promise<void> {
    await this.updateOptimizationStatus(
      taskId,
      OptimizationStatusType.COMPLETED,
    );
  }

  /**
   * Deletes optimization task by id.
   */
  public async deleteOptimization(taskId: string): Promise<void> {
    await this.redis.delete(RedisKeys.imageOptimizationById(taskId));
  }

  // ------------------ Database (ORM) ------------------

  public async findById(id: string): Promise<ImageDomain | null> {
    const key = RedisKeys.imageById(id);
    const cached = await this.redis.get<ImageOrm>(key);
    if (cached) return ImageMapper.toDomain(cached);

    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;

    await this.redis.set(key, entity, RedisTTL.IMAGE);
    return ImageMapper.toDomain(entity);
  }

  public async findByAccountId(accountId: string): Promise<ImageDomain[]> {
    const entities = await this.repo.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((e) => ImageMapper.toDomain(e));
  }

  public async findByFilename(
    filename: string,
    accountId: string,
  ): Promise<ImageDomain | null> {
    const entity = await this.repo.findOne({
      where: { filename, accountId },
    });

    if (!entity) return null;

    await this.redis.set(
      RedisKeys.imageById(entity.id),
      entity,
      RedisTTL.IMAGE,
    );
    return ImageMapper.toDomain(entity);
  }

  public async findExpired(batchSize = 100): Promise<ImageDomain[]> {
    const entities = await this.repo.find({
      where: {
        status: MediaStatusType.TEMPORARY,
        expiresAt: LessThan(new Date()),
      },
      order: { createdAt: 'ASC' },
      take: batchSize,
      relations: ['account', 'quota'],
    });

    return entities.map((e) => ImageMapper.toDomain(e));
  }

  public async save(image: ImageDomain): Promise<ImageDomain> {
    const persistenceData = ImageMapper.toPersistence(image);
    const saved = await this.repo.save(persistenceData);

    const key = RedisKeys.imageById(saved.id);
    await this.redis.delete([
      key,
      RedisKeys.imagesByAccountId(saved.accountId),
    ]);

    const refreshed = await this.repo.findOne({ where: { id: saved.id } });
    if (refreshed) {
      await this.redis.set(key, refreshed, RedisTTL.IMAGE);
      return ImageMapper.toDomain(refreshed);
    }

    return ImageMapper.toDomain(saved as ImageOrm);
  }

  public async delete(id: string): Promise<boolean> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return false;

    const result = await this.repo.delete(id);
    await this.redis.delete([
      RedisKeys.imageById(id),
      RedisKeys.imagesByAccountId(entity.accountId),
    ]);

    return !!result.affected;
  }
}
