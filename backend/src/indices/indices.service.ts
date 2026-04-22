import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { fetchIndexDetails, fetchIndices, IndexData, IndexDetails } from './fetcher';
import { EventsService } from '../websocket/events.service';

@Injectable()
export class IndicesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndicesService.name);
  private interval?: ReturnType<typeof setInterval>;
  private latestIndices: IndexData[] = [];

  constructor(private readonly events: EventsService) {}

  async onModuleInit() {
    await this.refreshIndices();
    this.interval = setInterval(async () => {
      await this.refreshIndices();
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

  async getIndex(code: string): Promise<IndexData | undefined> {
    const all = await this.getIndices();
    return all.find((item) => item.code === code);
  }

  async getIndexDetails(code: string): Promise<IndexDetails> {
    return fetchIndexDetails(code);
  }

  private async refreshIndices() {
    const data = await this.tryFetchIndices();
    if (!data) {
      return;
    }

    this.latestIndices = data;
    this.events.emit(data);
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
}
