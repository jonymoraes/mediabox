import { Test, TestingModule } from '@nestjs/testing';
import { AccountGateway } from '@/src/adapters/inbound/ws/websockets/account.gateway';
import { WebsocketGuard } from '@/src/adapters/inbound/ws/guards/websocket.guard';
import { websocketRelayMock } from '@/test/mocks/adapters/inbound/ws/relays/websocket-relay.factory';
import { AccountToDto } from '@/src/application/identity/account/dto/output/account.to-dto';
import { Logger } from '@nestjs/common';

describe('AccountGateway', () => {
  let gateway: AccountGateway;
  let relayMock: ReturnType<typeof websocketRelayMock>;
  let guard: jest.Mocked<WebsocketGuard>;

  beforeEach(async () => {
    relayMock = websocketRelayMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountGateway,
        {
          provide: WebsocketGuard,
          useValue: {
            verifyApiKey: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<AccountGateway>(AccountGateway);
    guard = module.get(WebsocketGuard);

    Object.defineProperty(gateway, 'socket', {
      get: () => relayMock,
      configurable: true,
    });

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('emitUpdated', () => {
    it('should return early if account is missing', () => {
      gateway.emitUpdated(null as any);
      expect(relayMock.toUser).not.toHaveBeenCalled();
    });

    it('should return early if account id is missing', () => {
      const accountWithoutId = { name: 'test' } as unknown as AccountToDto;
      gateway.emitUpdated(accountWithoutId);
      expect(relayMock.toUser).not.toHaveBeenCalled();
    });

    it('should emit account-updated to the specific account owner', () => {
      const accountDto = {
        id: 'acc-123',
        name: 'Owner',
      } as unknown as AccountToDto;
      gateway.emitUpdated(accountDto);
      expect(relayMock.toUser).toHaveBeenCalledWith('acc-123');
      expect(relayMock.emit).toHaveBeenCalledWith(
        'account-updated',
        accountDto,
      );
    });
  });

  describe('BaseGateway logic', () => {
    it('should handle connection and add client to usersMap if authenticated', async () => {
      const mockClient = {
        id: 'socket-1',
        handshake: { query: {} },
        join: jest.fn(),
      } as any;
      const mockAccount = { id: 'acc-123' };
      guard.verifyApiKey.mockResolvedValue(mockAccount as any);

      await gateway.handleConnection(mockClient);

      expect(guard.verifyApiKey).toHaveBeenCalledWith(mockClient, 'private');
      // Verify client was added to usersMap (accessing protected property)
      expect((gateway as any).usersMap.get('acc-123').has(mockClient)).toBe(
        true,
      );
    });

    it('should handle connection for anonymous clients in private mode', async () => {
      const mockClient = { id: 'socket-1', handshake: { query: {} } } as any;
      guard.verifyApiKey.mockResolvedValue(null);

      await gateway.handleConnection(mockClient);

      expect((gateway as any).usersMap.size).toBe(0);
    });

    it('should join room if provided in query during connection', async () => {
      const mockClient = {
        id: 'socket-1',
        handshake: { query: { room: 'room-1' } },
        join: jest.fn(),
      } as any;
      guard.verifyApiKey.mockResolvedValue({ id: 'acc-123' } as any);

      await gateway.handleConnection(mockClient);

      expect(mockClient.join).toHaveBeenCalledWith('room-1');
    });

    it('should handle disconnection and remove client from usersMap', () => {
      const accountId = 'acc-123';
      const mockClient = {
        id: 'socket-1',
        data: { user: { id: accountId } },
        handshake: { query: {} },
        leave: jest.fn(),
      } as any;

      // Manually populate usersMap
      const sockets = new Set([mockClient]);
      (gateway as any).usersMap.set(accountId, sockets);

      gateway.handleDisconnect(mockClient);

      expect((gateway as any).usersMap.has(accountId)).toBe(false);
    });

    it('should leave room on disconnect if provided', () => {
      const mockClient = {
        id: 'socket-1',
        data: {},
        handshake: { query: { room: 'room-1' } },
        leave: jest.fn(),
      } as any;
      (gateway as any).server = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      gateway.handleDisconnect(mockClient);

      expect(mockClient.leave).toHaveBeenCalledWith('room-1');
    });
  });
});
