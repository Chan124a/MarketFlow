import { Module } from '@nestjs/common';
import { IndicesModule } from '../indices/indices.module';
import { QuantController } from './quant.controller';
import { QuantService } from './quant.service';

@Module({
  imports: [IndicesModule],
  controllers: [QuantController],
  providers: [QuantService],
})
export class QuantModule {}
