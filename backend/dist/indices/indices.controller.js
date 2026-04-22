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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicesController = void 0;
const common_1 = require("@nestjs/common");
const indices_service_1 = require("./indices.service");
let IndicesController = class IndicesController {
    constructor(service) {
        this.service = service;
    }
    async findAll() {
        const data = await this.service.getIndices();
        return { success: true, data, stale: data.length === 0 };
    }
    async findDetails(code) {
        const data = await this.service.getIndexDetails(code);
        return { success: true, data };
    }
    async findOne(code) {
        const data = await this.service.getIndex(code);
        if (!data) {
            return { success: false, error: 'Index not found' };
        }
        return { success: true, data };
    }
};
exports.IndicesController = IndicesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IndicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':code/details'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IndicesController.prototype, "findDetails", null);
__decorate([
    (0, common_1.Get)(':code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IndicesController.prototype, "findOne", null);
exports.IndicesController = IndicesController = __decorate([
    (0, common_1.Controller)('api/indices'),
    __metadata("design:paramtypes", [indices_service_1.IndicesService])
], IndicesController);
//# sourceMappingURL=indices.controller.js.map