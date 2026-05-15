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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRateEntity = void 0;
const typeorm_1 = require("typeorm");
let ExchangeRateEntity = class ExchangeRateEntity {
};
exports.ExchangeRateEntity = ExchangeRateEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ExchangeRateEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], ExchangeRateEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency_pair', length: 50 }),
    __metadata("design:type", String)
], ExchangeRateEntity.prototype, "currencyPair", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], ExchangeRateEntity.prototype, "buyPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], ExchangeRateEntity.prototype, "sellPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], ExchangeRateEntity.prototype, "averagePrice", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Object)
], ExchangeRateEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_updated', type: 'timestamp' }),
    __metadata("design:type", Date)
], ExchangeRateEntity.prototype, "lastUpdated", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], ExchangeRateEntity.prototype, "createdAt", void 0);
exports.ExchangeRateEntity = ExchangeRateEntity = __decorate([
    (0, typeorm_1.Entity)('exchange_rates')
], ExchangeRateEntity);
