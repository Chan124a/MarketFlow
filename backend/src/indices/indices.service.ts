import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { fetchIndices, IndexData } from './fetcher';
import { EventsService } from '../websocket/events.service';

@Injectable()
export class IndicesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndicesService.name);
  private interval: ReturnType<typeof setInterval>;

  constructor(private readonly events: EventsService) {}

  async onModuleInit() {
    const data = await fetchIndices();
    this.events.emit(data);
    this.interval = setInterval(async () => {
      try {
        const data = await fetchIndices();
        this.events.emit(data);
      } catch (error) {
        this.logger.error('Failed to fetch indices', error);
      }
    }, 30000);
  }

  onModuleDestroy() {
    clearInterval(this.interval);
  }

  async getIndices(): Promise<IndexData[]> {
    return fetchIndices();
  }

  async getIndex(code: string): Promise<IndexData | undefined> {
    const all = await fetchIndices();
    return all.find((item) => item.code === code);
  }
}