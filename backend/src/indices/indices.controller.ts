import { Controller, Get, Param } from '@nestjs/common';
import { IndicesService } from './indices.service';

@Controller('api/stocks')
export class StocksController {
  constructor(private readonly service: IndicesService) {}

  @Get()
  async findAll() {
    const data = await this.service.getStocks();
    return { success: true, data };
  }

  @Get(':code/financials')
  async findFinancials(@Param('code') code: string) {
    const data = await this.service.getStockFinancials(code);
    if (!data) {
      return { success: false, error: 'Stock not found or no financial data' };
    }
    return { success: true, data };
  }
}

@Controller('api/indices')
export class IndicesController {
  constructor(private readonly service: IndicesService) {}

  @Get()
  async findAll() {
    const data = await this.service.getIndices();
    return { success: true, data, stale: data.length === 0 };
  }

  @Get(':code/details')
  async findDetails(@Param('code') code: string) {
    const data = await this.service.getIndexDetails(code);
    return { success: true, data };
  }

  @Get(':code')
  async findOne(@Param('code') code: string) {
    const data = await this.service.getIndex(code);
    if (!data) {
      return { success: false, error: 'Index not found' };
    }
    return { success: true, data };
  }
}
