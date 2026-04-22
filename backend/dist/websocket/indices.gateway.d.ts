import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { EventsService } from './events.service';
export declare class IndicesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly events;
    private readonly logger;
    server: Server;
    constructor(events: EventsService);
    afterInit(): void;
    handleConnection(client: any): void;
    handleDisconnect(client: any): void;
    handlePing(): {
        event: string;
        data: {
            timestamp: number;
        };
    };
}
