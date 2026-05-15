"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const exchange_controller_1 = require("./exchange.controller");
const exchange_rate_entity_1 = require("./entities/exchange-rate.entity");
const exchange_rate_repository_1 = require("./repositories/exchange-rate.repository");
const exchange_service_1 = require("./exchange.service");
const binance_service_1 = require("./binance.service");
const bcv_scraper_service_1 = require("./bcv-scraper.service");
let ExchangeModule = class ExchangeModule {
};
exports.ExchangeModule = ExchangeModule;
exports.ExchangeModule = ExchangeModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([exchange_rate_entity_1.ExchangeRateEntity])],
        controllers: [exchange_controller_1.ExchangeController],
        providers: [exchange_service_1.ExchangeService, exchange_rate_repository_1.ExchangeRateRepository, binance_service_1.BinanceService, bcv_scraper_service_1.BcvScraperService],
        exports: [exchange_rate_repository_1.ExchangeRateRepository],
    })
], ExchangeModule);
