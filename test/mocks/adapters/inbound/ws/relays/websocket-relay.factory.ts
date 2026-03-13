import { WebsocketRelay } from '@/src/adapters/inbound/ws/relays/websocket.relay';

/**
 * Factory to create a mocked instance of WebsocketRelay.
 */
export const websocketRelayMock = (): jest.Mocked<WebsocketRelay> => {
  const mock = new (class extends (WebsocketRelay as any) {
    constructor() {
      super(null, null);
    }
    toUser = jest.fn().mockReturnThis();
    toAll = jest.fn().mockReturnThis();
    toRole = jest.fn().mockReturnThis();
    emit = jest.fn().mockReturnThis();
  })();

  return mock as unknown as jest.Mocked<WebsocketRelay>;
};
