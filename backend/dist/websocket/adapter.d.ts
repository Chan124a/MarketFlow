import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
export declare class WebSocketAdapter extends IoAdapter {
    constructor(app: INestApplication);
}
