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
        this.latestIndices = [];
    }
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
    async getIndices() {
        const data = await this.tryFetchIndices();
        return data ?? this.latestIndices;
    }
    async getIndex(code) {
        const all = await this.getIndices();
        return all.find((item) => item.code === code);
    }
    async getIndexDetails(code) {
        return (0, fetcher_1.fetchIndexDetails)(code);
    }
    async refreshIndices() {
        const data = await this.tryFetchIndices();
        if (!data) {
            return;
        }
        this.latestIndices = data;
        this.events.emit(data);
    }
    async tryFetchIndices() {
        try {
            return await (0, fetcher_1.fetchIndices)();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to fetch indices: ${message}`);
            return null;
        }
    }
};
exports.IndicesService = IndicesService;
exports.IndicesService = IndicesService = IndicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], IndicesService);
//# sourceMappingURL=indices.service.js.map