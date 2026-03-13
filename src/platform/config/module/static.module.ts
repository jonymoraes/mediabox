import { Module, forwardRef } from '@nestjs/common';

//  Controllers
import { StaticController } from '@/src/adapters/inbound/rest/controllers/media/static.controller';

//  Modules
import { AccountModule } from './account.module';
import { QuotaModule } from './quota.module';

// UseCases
import { UpdateTransferUseCase } from '@/src/application/identity/quota/use-case/update-transfer.use-case';

//  Websockets
import { WebsocketGuard } from '@/src/adapters/inbound/ws/guards/websocket.guard';

@Module({
  imports: [forwardRef(() => AccountModule), forwardRef(() => QuotaModule)],
  controllers: [StaticController],
  providers: [WebsocketGuard, UpdateTransferUseCase],
})
export class StaticModule {}
