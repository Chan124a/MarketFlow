import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { fetchIndexDetails, fetchIndices, fetchStocks, fetchStockFinancials, IndexData, IndexDetails, StockFinancials } from './fetcher';
import { EventsService } from '../websocket/events.service';

@Injectable()
export class IndicesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndicesService.name);
  private interval?: ReturnType<typeof setInterval>;
  private latestIndices: IndexData[] = [];
  private latestStocks: IndexData[] = [];

  constructor(private readonly events: EventsService) {}

  async onModuleInit() {
    await this.refreshAll();
    this.interval = setInterval(async () => {
      await this.refreshAll();
    }, 30000);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async getIndices(): Promise<IndexData[]> {
    const data = await this.tryFetchIndices();
    return data ?? this.latestIndices;
  }

  async getStocks(): Promise<IndexData[]> {
    const data = await this.tryFetchStocks();
    return data ?? this.latestStocks;
  }

  async getIndex(code: string): Promise<IndexData | undefined> {
    const all = await this.getIndices();
    return all.find((item) => item.code === code);
  }

  async getIndexDetails(code: string): Promise<IndexDetails> {
    return fetchIndexDetails(code);
  }

  async getStockFinancials(code: string): Promise<StockFinancials | null> {
    return fetchStockFinancials(code);
  }

  private async refreshAll() {
    const [indices, stocks] = await Promise.all([
      this.tryFetchIndices(),
      this.tryFetchStocks(),
    ]);

    if (indices) {
      this.latestIndices = indices;
      this.events.emit(indices);
    }

    if (stocks) {
      this.latestStocks = stocks;
    }
  }

  private async tryFetchIndices(): Promise<IndexData[] | null> {
    try {
      return await fetchIndices();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to fetch indices: ${message}`);
      return null;
    }
  }

  private async tryFetchStocks(): Promise<IndexData[] | null> {
    try {
      return await fetchStocks();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to fetch stocks: ${message}`);
      return null;
    }
  }
}
