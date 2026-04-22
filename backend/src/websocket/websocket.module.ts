import { Module, Global } from '@nestjs/common';
import { EventsService } from './events.service';
import { IndicesGateway } from './indices.gateway';

@Global()
@Module({
  providers: [EventsService, IndicesGateway],
  exports: [EventsService],
})
export class WebsocketModule {}