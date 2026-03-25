import { WebSocketGateway } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { WebsocketGuard } from '../guards/websocket.guard';
import { BaseGateway } from '../abstract/base.gateway';

// BullMQ
import { QueueEvents } from 'bullmq';
import { createBullMQRedisConfig } from '@/src/platform/config/settings/bullmq.config';

@WebSocketGateway({
  namespace: 'video',
  cors: { origin: '*', credentials: false },
})
@Injectable()
export class VideoGateway extends BaseGateway {
  private readonly videoEvents = new QueueEvents('video-transcoding', {
    connection: createBullMQRedisConfig(),
  });

  private eventsRegistered = false;

  constructor(protected readonly guard: WebsocketGuard) {
    super(guard, VideoGateway.name, 'private');
    this.registerQueueListeners();
  }

  private registerQueueListeners(): void {
    if (this.eventsRegistered) return;
    this.eventsRegistered = true;

    // Progress
    this.videoEvents.on('progress', ({ jobId, data }) => {
      const payload = (
        typeof data === 'object' ? data : { percentage: data }
      ) as any;

      const { accountId, client, ...rest } = payload;

      if (accountId && client) {
        this.socket
          .toRoom(accountId, client)
          .emit('video-progress', { jobId, ...rest });
      } else if (accountId) {
        this.socket
          .toAccount(accountId)
          .emit('video-progress', { jobId, ...rest });
      } else {
        this.server.emit('video-progress', { jobId, ...rest });
      }
    });

    // Completed
    this.videoEvents.on('completed', ({ jobId, returnvalue }) => {
      const payload = (
        typeof returnvalue === 'object' && returnvalue !== null
          ? returnvalue
          : { url: returnvalue }
      ) as any;

      const { accountId, client, url } = payload;

      if (accountId && client) {
        this.socket
          .toRoom(accountId, client)
          .emit('video-completed', { jobId, url });
      } else if (accountId) {
        this.socket
          .toAccount(accountId)
          .emit('video-completed', { jobId, url });
      } else {
        this.server.emit('video-completed', { jobId, url });
      }
    });

    // Failed
    this.videoEvents.on('failed', ({ jobId, failedReason }) => {
      this.server.emit('video-failed', { jobId, reason: failedReason });
      this.logger.error(`Video job ${jobId} failed: ${failedReason}`);
    });

    this.logger.log(
      'Video queue listeners registered with hierarchical routing.',
    );
  }
}
