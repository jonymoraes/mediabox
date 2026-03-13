import { Test, TestingModule } from '@nestjs/testing';
import { ImageGateway } from '@/src/adapters/inbound/ws/websockets/image.gateway';
import { WebsocketGuard } from '@/src/adapters/inbound/ws/guards/websocket.guard';
import { websocketRelayMock } from '@/test/mocks/adapters/inbound/ws/relays/websocket-relay.factory';
import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

// Mock de QueueEvents de BullMQ antes de importar el gateway
const mockQueueEvents = new EventEmitter();
jest.mock('bullmq', () => ({
  QueueEvents: jest.fn().mockImplementation(() => mockQueueEvents),
}));

// Mock de la configuración de Redis
jest.mock('@/src/platform/config/settings/bullmq.config', () => ({
  createBullMQRedisConfig: jest.fn().mockReturnValue({}),
}));

describe('ImageGateway', () => {
  let gateway: ImageGateway;
  let relayMock: ReturnType<typeof websocketRelayMock>;
  let guard: jest.Mocked<WebsocketGuard>;

  beforeEach(async () => {
    relayMock = websocketRelayMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageGateway,
        {
          provide: WebsocketGuard,
          useValue: { verifyApiKey: jest.fn() },
        },
      ],
    }).compile();

    gateway = module.get<ImageGateway>(ImageGateway);
    guard = module.get(WebsocketGuard);

    // Interceptar el relay
    Object.defineProperty(gateway, 'socket', {
      get: () => relayMock,
      configurable: true,
    });

    // Mock del server de socket.io para BaseGateway y emisiones globales
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
    it('should emit image-progress to specific user when accountId exists', () => {
      // GIVEN
      const jobId = 'job-123';
      const data = { accountId: 'acc-1', percentage: 50, stage: 'optimizing' };

      // WHEN - Simulamos el evento de BullMQ
      mockQueueEvents.emit('progress', { jobId, data });

      // THEN
      expect(relayMock.toUser).toHaveBeenCalledWith('acc-1');
      expect(relayMock.emit).toHaveBeenCalledWith('image-progress', {
        jobId,
        percentage: 50,
        stage: 'optimizing',
      });
    });

    it('should emit image-progress to all if accountId is missing', () => {
      // GIVEN
      const jobId = 'job-123';
      const data = { percentage: 80 };

      // WHEN
      mockQueueEvents.emit('progress', { jobId, data });

      // THEN
      expect((gateway as any).server.emit).toHaveBeenCalledWith(
        'image-progress',
        {
          jobId,
          percentage: 80,
        },
      );
    });

    it('should handle completed event and emit to user', () => {
      // GIVEN
      const jobId = 'job-123';
      const returnvalue = { accountId: 'acc-1', url: 'http://image.com/1.jpg' };

      // WHEN
      mockQueueEvents.emit('completed', { jobId, returnvalue });

      // THEN
      expect(relayMock.toUser).toHaveBeenCalledWith('acc-1');
      expect(relayMock.emit).toHaveBeenCalledWith('image-completed', {
        jobId,
        url: 'http://image.com/1.jpg',
      });
    });

    it('should handle failed event and emit image-canceled globally', () => {
      // GIVEN
      const jobId = 'job-failed';

      // WHEN
      mockQueueEvents.emit('failed', { jobId });

      // THEN
      expect((gateway as any).server.emit).toHaveBeenCalledWith(
        'image-canceled',
        { jobId },
      );
    });
  });

  describe('Inherited BaseGateway logic', () => {
    it('should handle connection and verify API key', async () => {
      const mockClient = {
        id: 's1',
        handshake: { query: {} },
        join: jest.fn(),
      } as any;
      guard.verifyApiKey.mockResolvedValue({ id: 'acc-123' } as any);

      await gateway.handleConnection(mockClient);

      expect(guard.verifyApiKey).toHaveBeenCalled();
      expect((gateway as any).usersMap.has('acc-123')).toBe(true);
    });

    it('should cleanup usersMap on disconnect', () => {
      const mockClient = {
        id: 's1',
        data: { user: { id: 'acc-1' } },
        handshake: { query: {} },
        leave: jest.fn(),
      } as any;

      (gateway as any).usersMap.set('acc-1', new Set([mockClient]));
      gateway.handleDisconnect(mockClient);

      expect((gateway as any).usersMap.has('acc-1')).toBe(false);
    });
  });
});
