import { Controller, Get } from '@nestjs/common';
import { QuantService } from './quant.service';

@Controller('api/quant')
export class QuantController {
  constructor(private readonly service: QuantService) {}

  @Get('health')
  async health() {
    return this.service.health();
  }

  @Get('strategies')
  async strategies() {
    return this.service.strategies();
  }

  @Get('signals')
  async signals() {
    return this.service.signals();
  }
}
