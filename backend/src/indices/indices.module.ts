import { Module } from '@nestjs/common';
import { IndicesService } from './indices.service';
import { IndicesController } from './indices.controller';

@Module({
  providers: [IndicesService],
  controllers: [IndicesController],
  exports: [IndicesService],
})
export class IndicesModule {}
