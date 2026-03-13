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
      const { accountId, ...rest } = payload;

      if (accountId) {
        this.socket
          .toUser(accountId)
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

      const { accountId, url } = payload;

      if (accountId) {
        this.socket.toUser(accountId).emit('video-completed', { jobId, url });
      } else {
        this.server.emit('video-completed', { jobId, url });
      }
    });

    // Removed / Failed
    this.videoEvents.on('failed', ({ jobId }) => {
      this.server.emit('video-canceled', { jobId });
    });

    this.logger.log('Video queue listeners registered.');
  }
}
