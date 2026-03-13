import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

//  BullMQ
import { BullModule } from '@nestjs/bullmq';
import { ImageOptimizationWorker } from '@/src/adapters/inbound/workers/image-optimization.worker';

//  Entities & transformers
import { Image } from '@/src/adapters/outbound/persistence/modules/media/entities/image.entity-orm';
import { ImageUploadTransformer } from '@/src/adapters/inbound/rest/transformers/image-upload.transformer';

//  Controllers
import { ImageController } from '@/src/adapters/inbound/rest/controllers/media/image.controller';

//  Ports
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';

//  Repositories
import { ImageRepository } from '@/src/adapters/outbound/persistence/modules/media/repositories/image.repository';

//  Modules
import { RedisModule } from './redis.module';
import { QuotaModule } from './quota.module';
import { AccountModule } from './account.module';

//  UseCases
import { OptimizeImageUseCase } from '@/src/application/media/image/use-cases/optimize-image.use-case';
import { ImageUploadUseCase } from '@/src/application/media/image/use-cases/image-upload.use-case';
import { ImageCancelUseCase } from '@/src/application/media/image/use-cases/image-cancel.use-case';
import { UpdateImageUseCase } from '@/src/application/media/image/use-cases/update-image.use-case';
import { DeleteImageUseCase } from '@/src/application/media/image/use-cases/delete-image.use-case';

//  Websockets
import { WebsocketGuard } from '@/src/adapters/inbound/ws/guards/websocket.guard';
import { ImageGateway } from '@/src/adapters/inbound/ws/websockets/image.gateway';
import { AccountGateway } from '@/src/adapters/inbound/ws/websockets/account.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image]),
    BullModule.registerQueue({ name: 'image-optimization' }),
    forwardRef(() => RedisModule),
    forwardRef(() => AccountModule),
    forwardRef(() => QuotaModule),
  ],
  controllers: [ImageController],
  providers: [
    ImageUploadTransformer,
    ImageGateway,
    AccountGateway,
    OptimizeImageUseCase,
    ImageUploadUseCase,
    ImageCancelUseCase,
    UpdateImageUseCase,
    DeleteImageUseCase,
    ImageOptimizationWorker,
    {
      provide: ImagePort,
      useExisting: ImageRepository,
    },
    WebsocketGuard,
    ImageRepository,
  ],
  exports: [ImagePort],
})
export class ImageModule {}
