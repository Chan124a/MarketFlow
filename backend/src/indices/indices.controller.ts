import { Controller, Get, Param } from '@nestjs/common';
import { IndicesService } from './indices.service';

@Controller('api/indices')
export class IndicesController {
  constructor(private readonly service: IndicesService) {}

  @Get()
  async findAll() {
    const data = await this.service.getIndices();
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