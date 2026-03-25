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

  /**
   * Registers listeners for the image optimization queue.
   * Ensures events are routed to the specific account and tunnel (client).
   */
  private registerQueueListeners(): void {
    if (this.eventsRegistered) return;
    this.eventsRegistered = true;

    // Progress
    this.imageEvents.on('progress', ({ jobId, data }) => {
      const payload = (
        typeof data === 'object' ? data : { percentage: data }
      ) as any;

      const { accountId, client, ...rest } = payload;

      if (accountId && client) {
        this.socket
          .toRoom(accountId, client)
          .emit('image-progress', { jobId, ...rest });
      } else if (accountId) {
        this.socket
          .toAccount(accountId)
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

      const { accountId, client, url } = payload;

      if (accountId && client) {
        this.socket
          .toRoom(accountId, client)
          .emit('image-completed', { jobId, url });
      } else if (accountId) {
        this.socket
          .toAccount(accountId)
          .emit('image-completed', { jobId, url });
      } else {
        this.server.emit('image-completed', { jobId, url });
      }
    });

    // Failed / Canceled
    this.imageEvents.on('failed', ({ jobId, failedReason }) => {
      this.server.emit('image-failed', { jobId, reason: failedReason });
      this.logger.error(`Job ${jobId} failed: ${failedReason}`);
    });

    this.logger.log(
      'Image queue listeners registered with hierarchical routing.',
    );
  }
}
