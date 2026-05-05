import { Module } from '@nestjs/common';
import { IndicesModule } from './indices/indices.module';
import { QuantModule } from './quant/quant.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [WebsocketModule, IndicesModule, QuantModule],
})
export class AppModule {}
