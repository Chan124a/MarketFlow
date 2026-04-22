"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IndicesGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const events_service_1 = require("./events.service");
let IndicesGateway = IndicesGateway_1 = class IndicesGateway {
    constructor(events) {
        this.events = events;
        this.logger = new common_1.Logger(IndicesGateway_1.name);
    }
    afterInit() {
        this.events.subscribe((data) => {
            this.server.emit('indices:update', { success: true, data });
        });
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handlePing() {
        return { event: 'pong', data: { timestamp: Date.now() } };
    }
};
exports.IndicesGateway = IndicesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], IndicesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IndicesGateway.prototype, "handlePing", null);
exports.IndicesGateway = IndicesGateway = IndicesGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], IndicesGateway);
//# sourceMappingURL=indices.gateway.js.map