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
var IndicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicesService = void 0;
const common_1 = require("@nestjs/common");
const fetcher_1 = require("./fetcher");
const events_service_1 = require("../websocket/events.service");
let IndicesService = IndicesService_1 = class IndicesService {
    constructor(events) {
        this.events = events;
        this.logger = new common_1.Logger(IndicesService_1.name);
    }
    async onModuleInit() {
        const data = await (0, fetcher_1.fetchIndices)();
        this.events.emit(data);
        this.interval = setInterval(async () => {
            try {
                const data = await (0, fetcher_1.fetchIndices)();
                this.events.emit(data);
            }
            catch (error) {
                this.logger.error('Failed to fetch indices', error);
            }
        }, 30000);
    }
    onModuleDestroy() {
        clearInterval(this.interval);
    }
    async getIndices() {
        return (0, fetcher_1.fetchIndices)();
    }
    async getIndex(code) {
        const all = await (0, fetcher_1.fetchIndices)();
        return all.find((item) => item.code === code);
    }
};
exports.IndicesService = IndicesService;
exports.IndicesService = IndicesService = IndicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], IndicesService);
//# sourceMappingURL=indices.service.js.map