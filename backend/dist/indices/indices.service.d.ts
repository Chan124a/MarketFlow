import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { IndexData } from './fetcher';
import { EventsService } from '../websocket/events.service';
export declare class IndicesService implements OnModuleInit, OnModuleDestroy {
    private readonly events;
    private readonly logger;
    private interval;
    constructor(events: EventsService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    getIndices(): Promise<IndexData[]>;
    getIndex(code: string): Promise<IndexData | undefined>;
}
