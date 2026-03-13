import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

//  BullMQ
import { BullModule } from '@nestjs/bullmq';
import { VideoTranscodingWorker } from '@/src/adapters/inbound/workers/video-transcoding.worker';

//  Entities
import { Video } from '@/src/adapters/outbound/persistence/modules/media/entities/video.entity-orm';
import { VideoUploadTransformer } from '@/src/adapters/inbound/rest/transformers/video-upload.transformer';

//  Controllers
import { VideoController } from '@/src/adapters/inbound/rest/controllers/media/video.controller';

//  Ports
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';

//  Repositories
import { VideoRepository } from '@/src/adapters/outbound/persistence/modules/media/repositories/video.repository';

//  Modules
import { RedisModule } from './redis.module';
import { QuotaModule } from './quota.module';
import { AccountModule } from './account.module';

//  UseCases
import { TranscodeVideoUseCase } from '@/src/application/media/video/use-cases/transcode-video.use-case';
import { VideoUploadUseCase } from '@/src/application/media/video/use-cases/video-upload.use-case';
import { VideoCancelUseCase } from '@/src/application/media/video/use-cases/video-cancel.use-case';
import { UpdateVideoUseCase } from '@/src/application/media/video/use-cases/update-video.use-case';
import { DeleteVideoUseCase } from '@/src/application/media/video/use-cases/delete-video.use-case';

//  Websockets
import { WebsocketGuard } from '@/src/adapters/inbound/ws/guards/websocket.guard';
import { VideoGateway } from '@/src/adapters/inbound/ws/websockets/video.gateway';
import { AccountGateway } from '@/src/adapters/inbound/ws/websockets/account.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    BullModule.registerQueue({ name: 'video-transcoding' }),
    forwardRef(() => RedisModule),
    forwardRef(() => AccountModule),
    forwardRef(() => QuotaModule),
  ],
  controllers: [VideoController],
  providers: [
    VideoUploadTransformer,
    VideoGateway,
    AccountGateway,
    TranscodeVideoUseCase,
    VideoUploadUseCase,
    VideoCancelUseCase,
    UpdateVideoUseCase,
    DeleteVideoUseCase,
    VideoTranscodingWorker,
    {
      provide: VideoPort,
      useExisting: VideoRepository,
    },
    WebsocketGuard,
    VideoRepository,
  ],
  exports: [VideoPort],
})
export class VideoModule {}
