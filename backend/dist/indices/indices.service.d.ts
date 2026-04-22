import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { IndexData, IndexDetails } from './fetcher';
import { EventsService } from '../websocket/events.service';
export declare class IndicesService implements OnModuleInit, OnModuleDestroy {
    private readonly events;
    private readonly logger;
    private interval?;
    private latestIndices;
    constructor(events: EventsService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    getIndices(): Promise<IndexData[]>;
    getIndex(code: string): Promise<IndexData | undefined>;
    getIndexDetails(code: string): Promise<IndexDetails>;
    private refreshIndices;
    private tryFetchIndices;
}
