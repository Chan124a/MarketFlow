import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EventsService } from './events.service';
import { IndexData } from '../indices/fetcher';

@WebSocketGateway({ cors: { origin: '*' } })
export class IndicesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(IndicesGateway.name);
  @WebSocketServer()
  server: Server;

  constructor(private readonly events: EventsService) {}

  afterInit() {
    this.events.subscribe((data: IndexData[]) => {
      this.server.emit('indices:update', { success: true, data });
    });
  }

  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }
}