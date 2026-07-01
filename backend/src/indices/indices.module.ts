import { Module } from '@nestjs/common';
import { IndicesService } from './indices.service';
import { IndicesController, StocksController } from './indices.controller';

@Module({
  providers: [IndicesService],
  controllers: [IndicesController, StocksController],
  exports: [IndicesService],
})
export class IndicesModule {}
