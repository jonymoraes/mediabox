import { Test, TestingModule } from '@nestjs/testing';
import { VideoGateway } from '@/src/adapters/inbound/ws/websockets/video.gateway';
import { WebsocketGuard } from '@/src/adapters/inbound/ws/guards/websocket.guard';
import { websocketRelayMock } from '@/test/mocks/adapters/inbound/ws/relays/websocket-relay.factory';
import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

// Mock QueueEvents before gateway import
const mockQueueEvents = new EventEmitter();
jest.mock('bullmq', () => ({
  QueueEvents: jest.fn().mockImplementation(() => mockQueueEvents),
}));

// Mock Redis configuration
jest.mock('@/src/platform/config/settings/bullmq.config', () => ({
  createBullMQRedisConfig: jest.fn().mockReturnValue({}),
}));

describe('VideoGateway', () => {
  let gateway: VideoGateway;
  let relayMock: ReturnType<typeof websocketRelayMock>;
  let guard: jest.Mocked<WebsocketGuard>;

  beforeEach(async () => {
    relayMock = websocketRelayMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoGateway,
        {
          provide: WebsocketGuard,
          useValue: { verifyApiKey: jest.fn() },
        },
      ],
    }).compile();

    gateway = module.get<VideoGateway>(VideoGateway);
    guard = module.get(WebsocketGuard);

    // Intercept relay
    Object.defineProperty(gateway, 'socket', {
      get: () => relayMock,
      configurable: true,
    });

    // Mock socket.io server for BaseGateway and global emissions
    (gateway as any).server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('Queue Listeners', () => {
    it('should emit video-progress to specific user when accountId exists', () => {
      // GIVEN
      const jobId = 'v-job-1';
      const data = {
        accountId: 'acc-video-1',
        percentage: 45,
        stage: 'transcoding',
      };

      // WHEN
      mockQueueEvents.emit('progress', { jobId, data });

      // THEN
      expect(relayMock.toUser).toHaveBeenCalledWith('acc-video-1');
      expect(relayMock.emit).toHaveBeenCalledWith('video-progress', {
        jobId,
        percentage: 45,
        stage: 'transcoding',
      });
    });

    it('should emit video-progress to all if accountId is missing', () => {
      // GIVEN
      const jobId = 'v-job-2';
      const data = { percentage: 90 };

      // WHEN
      mockQueueEvents.emit('progress', { jobId, data });

      // THEN
      expect((gateway as any).server.emit).toHaveBeenCalledWith(
        'video-progress',
        {
          jobId,
          percentage: 90,
        },
      );
    });

    it('should handle completed event and emit video-completed to user', () => {
      // GIVEN
      const jobId = 'v-job-3';
      const returnvalue = {
        accountId: 'acc-video-1',
        url: 'http://cdn.com/v.mp4',
      };

      // WHEN
      mockQueueEvents.emit('completed', { jobId, returnvalue });

      // THEN
      expect(relayMock.toUser).toHaveBeenCalledWith('acc-video-1');
      expect(relayMock.emit).toHaveBeenCalledWith('video-completed', {
        jobId,
        url: 'http://cdn.com/v.mp4',
      });
    });

    it('should emit video-completed globally if accountId is missing on completion', () => {
      // GIVEN
      const jobId = 'v-job-4';
      const returnvalue = 'http://cdn.com/global.mp4';

      // WHEN
      mockQueueEvents.emit('completed', { jobId, returnvalue });

      // THEN
      expect((gateway as any).server.emit).toHaveBeenCalledWith(
        'video-completed',
        {
          jobId,
          url: returnvalue,
        },
      );
    });

    it('should handle failed event and emit video-canceled globally', () => {
      // GIVEN
      const jobId = 'v-job-failed';

      // WHEN
      mockQueueEvents.emit('failed', { jobId });

      // THEN
      expect((gateway as any).server.emit).toHaveBeenCalledWith(
        'video-canceled',
        { jobId },
      );
    });
  });

  describe('Inherited BaseGateway logic', () => {
    it('should handle connection and populate usersMap', async () => {
      const mockClient = {
        id: 'v-socket',
        handshake: { query: {} },
        join: jest.fn(),
      } as any;
      guard.verifyApiKey.mockResolvedValue({ id: 'acc-v' } as any);

      await gateway.handleConnection(mockClient);

      expect(guard.verifyApiKey).toHaveBeenCalled();
      expect((gateway as any).usersMap.get('acc-v').has(mockClient)).toBe(true);
    });

    it('should remove client from usersMap on disconnect', () => {
      const mockClient = {
        id: 'v-socket',
        data: { user: { id: 'acc-v' } },
        handshake: { query: {} },
        leave: jest.fn(),
      } as any;

      (gateway as any).usersMap.set('acc-v', new Set([mockClient]));
      gateway.handleDisconnect(mockClient);

      expect((gateway as any).usersMap.has('acc-v')).toBe(false);
    });
  });
});
