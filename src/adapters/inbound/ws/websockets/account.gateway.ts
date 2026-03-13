import { WebSocketGateway } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { WebsocketGuard } from '../guards/websocket.guard';
import { BaseGateway } from '../abstract/base.gateway';
import { AccountToDto } from '@/src/application/identity/account/dto/output/account.to-dto';

@WebSocketGateway({
  namespace: 'account',
  cors: { origin: '*', credentials: false },
})
@Injectable()
export class AccountGateway extends BaseGateway {
  constructor(protected readonly guard: WebsocketGuard) {
    super(guard, AccountGateway.name, 'private');
  }

  /**
   * @description Emit an AccountToDto only to the specific account owner
   * @param account Account DTO to emit
   */
  emitUpdated(account: AccountToDto) {
    if (!account?.id) return;

    // Emit to account owner
    this.socket.toUser(account.id).emit('account-updated', account);

    this.logger.log(`Emitted account-updated to account: ${account.id}`);
  }
}
