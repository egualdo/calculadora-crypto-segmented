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
exports.ExchangeController = void 0;
const common_1 = require("@nestjs/common");
const calculate_dto_1 = require("./dto/calculate.dto");
const save_exchange_rates_dto_1 = require("./dto/save-exchange-rates.dto");
const exchange_service_1 = require("./exchange.service");
let ExchangeController = class ExchangeController {
    constructor(exchangeService) {
        this.exchangeService = exchangeService;
    }
    async getRates() {
        return this.exchangeService.getLatestRates();
    }
    async getHistoricalRates() {
        return this.exchangeService.getHistoricalRateChartData();
    }
    async calculate(calculateDto) {
        return this.exchangeService.calculate(calculateDto);
    }
    async saveRates(payload) {
        return this.exchangeService.saveRates(payload.rates);
    }
    async fetchAndSaveRates() {
        return this.exchangeService.fetchAndSaveRates();
    }
};
exports.ExchangeController = ExchangeController;
__decorate([
    (0, common_1.Get)('rates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "getRates", null);
__decorate([
    (0, common_1.Get)('historical-rates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "getHistoricalRates", null);
__decorate([
    (0, common_1.Post)('calculate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_dto_1.CalculateDto]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "calculate", null);
__decorate([
    (0, common_1.Post)('rates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [save_exchange_rates_dto_1.SaveExchangeRatesDto]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "saveRates", null);
__decorate([
    (0, common_1.Post)('fetch-rates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "fetchAndSaveRates", null);
exports.ExchangeController = ExchangeController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [exchange_service_1.ExchangeService])
], ExchangeController);
