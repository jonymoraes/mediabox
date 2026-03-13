import { Injectable } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities & Mapper
import { Video as VideoOrm } from '../entities/video.entity-orm';
import { Video as VideoDomain } from '@/src/domain/media/entities/video.entity';
import { VideoMapper } from '../mappers/video.mapper';

// Ports
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';
import { RedisPort } from '@/src/domain/shared/ports/redis.port';

// Cache
import { RedisKeys } from '@/src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from '@/src/adapters/outbound/cache/redis-ttl';

// Domain / Value Objects & Types
import { MediaStatusType } from '@/src/domain/media/value-objects/media-status.vo';
import { VideoTranscoding } from '@/src/platform/shared/types/video-transcoding.type';
import { TranscodingStatusType } from '@/src/domain/media/value-objects/transcoding-status.vo';

// Transformers
import { TranscodingStatusTransformer } from '../transformers/transcoding-status.transformer';

@Injectable()
export class VideoRepository extends VideoPort {
  constructor(
    @InjectRepository(VideoOrm)
    private readonly repo: Repository<VideoOrm>,
    private readonly redis: RedisPort,
  ) {
    super();
  }

  // ------------------ Video Transcoding (Redis) ------------------

  /**
   * Retrieves a transcoding task from Redis and transforms it to domain.
   */
  public async getTranscoding(
    taskId: string,
  ): Promise<VideoTranscoding | null> {
    const data = await this.redis.get<any>(
      RedisKeys.videoTranscodingById(taskId),
    );

    if (!data) return null;

    return {
      ...data,
      status: TranscodingStatusTransformer.from(data.status),
    };
  }

  /**
   * Persists transcoding task metadata in Redis.
   */
  public async saveTranscoding(task: VideoTranscoding): Promise<void> {
    const persistenceData = {
      ...task,
      status: TranscodingStatusTransformer.to(task.status),
    };

    await this.redis.set(
      RedisKeys.videoTranscodingById(task.taskId),
      persistenceData,
      RedisTTL.VIDEO_JOB,
    );
  }

  /**
   * Generic status update for transcoding tasks.
   */
  public async updateTranscodingStatus(
    taskId: string,
    status: TranscodingStatusType,
  ): Promise<void> {
    const task = await this.getTranscoding(taskId);
    if (!task) return;

    task.status = TranscodingStatusTransformer.from(status);
    await this.saveTranscoding(task);
  }

  public async markTranscodingProcessing(taskId: string): Promise<void> {
    await this.updateTranscodingStatus(
      taskId,
      TranscodingStatusType.PROCESSING,
    );
  }

  public async markTranscodingCanceled(taskId: string): Promise<void> {
    await this.updateTranscodingStatus(taskId, TranscodingStatusType.CANCELED);
  }

  public async markTranscodingCompleted(taskId: string): Promise<void> {
    await this.updateTranscodingStatus(taskId, TranscodingStatusType.COMPLETED);
  }

  public async deleteTranscoding(taskId: string): Promise<void> {
    await this.redis.delete(RedisKeys.videoTranscodingById(taskId));
  }

  // ------------------ Database (ORM) ------------------

  public async findById(id: string): Promise<VideoDomain | null> {
    const key = RedisKeys.videoById(id);
    const cached = await this.redis.get<VideoOrm>(key);
    if (cached) return VideoMapper.toDomain(cached);

    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;

    await this.redis.set(key, entity, RedisTTL.VIDEO);
    return VideoMapper.toDomain(entity);
  }

  public async findByAccountId(accountId: string): Promise<VideoDomain[]> {
    const entities = await this.repo.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((e) => VideoMapper.toDomain(e));
  }

  public async findByFilename(
    filename: string,
    accountId: string,
  ): Promise<VideoDomain | null> {
    const entity = await this.repo.findOne({
      where: { filename, accountId },
    });

    if (!entity) return null;

    await this.redis.set(
      RedisKeys.videoById(entity.id),
      entity,
      RedisTTL.VIDEO,
    );

    return VideoMapper.toDomain(entity);
  }

  public async findExpired(batchSize = 100): Promise<VideoDomain[]> {
    const entities = await this.repo.find({
      where: {
        status: MediaStatusType.TEMPORARY,
        expiresAt: LessThan(new Date()),
      },
      order: { createdAt: 'ASC' },
      take: batchSize,
      relations: ['account', 'quota'],
    });

    return entities.map((e) => VideoMapper.toDomain(e));
  }

  public async save(video: VideoDomain): Promise<VideoDomain> {
    const persistenceData = VideoMapper.toPersistence(video);
    const saved = await this.repo.save(persistenceData);

    const key = RedisKeys.videoById(saved.id);
    await this.redis.delete([
      key,
      RedisKeys.videosByAccountId(saved.accountId),
    ]);

    const refreshed = await this.repo.findOne({ where: { id: saved.id } });
    if (refreshed) {
      await this.redis.set(key, refreshed, RedisTTL.VIDEO);
      return VideoMapper.toDomain(refreshed);
    }

    return VideoMapper.toDomain(saved as VideoOrm);
  }

  public async delete(id: string): Promise<boolean> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return false;

    const result = await this.repo.delete(id);

    await this.redis.delete([
      RedisKeys.videoById(id),
      RedisKeys.videosByAccountId(entity.accountId),
    ]);

    return !!result.affected;
  }
}
