import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IndicesService } from '../indices/indices.service';

@Injectable()
export class QuantService {
  private readonly logger = new Logger(QuantService.name);
  private readonly quantUrl = process.env.QUANT_SERVICE_URL ?? 'http://localhost:8000';

  constructor(private readonly indicesService: IndicesService) {}

  async health() {
    return this.get('/health');
  }

  async strategies() {
    return this.get('/strategies');
  }

  async signals() {
    const indices = await this.indicesService.getIndices();
    return this.post('/signals', { indices });
  }

  private async get(path: string) {
    try {
      const response = await axios.get(`${this.quantUrl}${path}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async post(path: string, data: unknown) {
    try {
      const response = await axios.post(`${this.quantUrl}${path}`, data);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Quant service request failed: ${message}`);
    return { success: false, error: 'Quant service unavailable' };
  }
}
