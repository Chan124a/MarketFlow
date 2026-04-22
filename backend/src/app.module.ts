import { Module } from '@nestjs/common';
import { IndicesModule } from './indices/indices.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [WebsocketModule, IndicesModule],
})
export class AppModule {}