import { WebSocketGateway } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { WebsocketGuard } from '../guards/websocket.guard';
import { BaseGateway } from '../abstract/base.gateway';

// BullMQ
import { QueueEvents } from 'bullmq';
import { createBullMQRedisConfig } from '@/src/platform/config/settings/bullmq.config';

@WebSocketGateway({
  namespace: 'image',
  cors: { origin: '*', credentials: false },
})
@Injectable()
export class ImageGateway extends BaseGateway {
  private readonly imageEvents = new QueueEvents('image-optimization', {
    connection: createBullMQRedisConfig(),
  });

  private eventsRegistered = false;

  constructor(protected readonly guard: WebsocketGuard) {
    super(guard, ImageGateway.name, 'private');
    this.registerQueueListeners();
  }

  private registerQueueListeners(): void {
    if (this.eventsRegistered) return;
    this.eventsRegistered = true;

    // Progress
    this.imageEvents.on('progress', ({ jobId, data }) => {
      const payload = (
        typeof data === 'object' ? data : { percentage: data }
      ) as any;
      const { accountId, ...rest } = payload;

      if (accountId) {
        this.socket
          .toUser(accountId)
          .emit('image-progress', { jobId, ...rest });
      } else {
        this.server.emit('image-progress', { jobId, ...rest });
      }
    });

    // Completed
    this.imageEvents.on('completed', ({ jobId, returnvalue }) => {
      const payload = (
        typeof returnvalue === 'object' && returnvalue !== null
          ? returnvalue
          : { url: returnvalue }
      ) as any;

      const { accountId, url } = payload;

      if (accountId) {
        this.socket.toUser(accountId).emit('image-completed', { jobId, url });
      } else {
        this.server.emit('image-completed', { jobId, url });
      }
    });

    // Removed / Failed
    this.imageEvents.on('failed', ({ jobId }) => {
      this.server.emit('image-canceled', { jobId });
    });

    this.logger.log('Image queue listeners registered.');
  }
}
