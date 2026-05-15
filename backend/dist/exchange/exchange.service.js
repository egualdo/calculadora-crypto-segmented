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
exports.ExchangeService = void 0;
const common_1 = require("@nestjs/common");
const exchange_rate_repository_1 = require("./repositories/exchange-rate.repository");
const binance_service_1 = require("./binance.service");
const bcv_scraper_service_1 = require("./bcv-scraper.service");
let ExchangeService = class ExchangeService {
    constructor(repository, binanceService, bcvScraperService) {
        this.repository = repository;
        this.binanceService = binanceService;
        this.bcvScraperService = bcvScraperService;
    }
    async getLatestRates() {
        // const rates = await this.repository.getLatestRates();
        await this.fetchAndSaveRates();
        const rates = await this.repository.getLatestRates();
        if (!this.hasRequiredRates(rates)) {
            await this.fetchAndSaveRates();
            return this.repository.getLatestRates();
        }
        return rates;
    }
    hasRequiredRates(rates) {
        const hasP2PBuy = rates.some((rate) => rate.type === 'p2p_buy');
        const hasP2PSell = rates.some((rate) => rate.type === 'p2p_sell');
        const hasOfficial = rates.some((rate) => rate.type === 'official');
        const hasEuro = rates.some((rate) => rate.type === 'euro');
        return hasP2PBuy && hasP2PSell && (hasOfficial || hasEuro);
    }
    async getHistoricalRateChartData() {
        return this.repository.getHistoricalRates();
    }
    async calculate(dto) {
        const rates = await this.getLatestRates();
        const rate = rates.find((item) => item.type === dto.rate_type);
        if (!rate) {
            throw new common_1.NotFoundException('Tipo de tasa no disponible');
        }
        const result = this.convertCurrency(dto.amount, dto.from_currency, dto.to_currency, rate.average_price);
        return {
            amount: dto.amount,
            from_currency: dto.from_currency,
            to_currency: dto.to_currency,
            rate_type: dto.rate_type,
            rate: rate.average_price,
            result,
        };
    }
    async saveRates(rates) {
        return this.repository.saveRates(rates);
    }
    async fetchAndSaveRates() {
        const ratesToSave = [];
        // Fetch from BCV
        const bcvRates = await this.bcvScraperService.getRates();
        if (bcvRates) {
            if (bcvRates['official']) {
                ratesToSave.push({
                    type: 'official',
                    currency_pair: 'USD/VES',
                    buy_price: bcvRates['official'].buy,
                    sell_price: bcvRates['official'].sell,
                    average_price: bcvRates['official'].average,
                    metadata: { source: 'bcv.org.ve', name: bcvRates['official'].name },
                    last_updated: bcvRates['official'].last_updated,
                });
            }
            if (bcvRates['euro']) {
                ratesToSave.push({
                    type: 'euro',
                    currency_pair: 'EUR/VES',
                    buy_price: bcvRates['euro'].buy,
                    sell_price: bcvRates['euro'].sell,
                    average_price: bcvRates['euro'].average,
                    metadata: { source: 'bcv.org.ve', name: bcvRates['euro'].name },
                    last_updated: bcvRates['euro'].last_updated,
                });
            }
        }
        // Fetch from Binance P2P
        const binanceBuy = await this.binanceService.getP2PRates('buy');
        if (binanceBuy) {
            ratesToSave.push({
                type: 'p2p_buy',
                currency_pair: 'USDT/VES',
                buy_price: binanceBuy.weighted_avg,
                sell_price: binanceBuy.weighted_avg,
                average_price: binanceBuy.weighted_avg,
                metadata: { source: 'binance.com', offers: binanceBuy.total_offers },
                last_updated: new Date().toISOString(),
            });
        }
        const binanceSell = await this.binanceService.getP2PRates('sell');
        if (binanceSell) {
            ratesToSave.push({
                type: 'p2p_sell',
                currency_pair: 'USDT/VES',
                buy_price: binanceSell.weighted_avg,
                sell_price: binanceSell.weighted_avg,
                average_price: binanceSell.weighted_avg,
                metadata: { source: 'binance.com', offers: binanceSell.total_offers },
                last_updated: new Date().toISOString(),
            });
        }
        return ratesToSave;
        if (ratesToSave.length > 0) {
            return this.repository.saveRates(ratesToSave);
        }
        return [];
    }
    convertCurrency(amount, from, to, rate) {
        if (from === to) {
            return amount;
        }
        if (from === 'VES' && to === 'USDT') {
            return amount / rate;
        }
        if (from === 'USDT' && to === 'VES') {
            return amount * rate;
        }
        if (from === 'VES' && to === 'USD') {
            return amount / rate;
        }
        if (from === 'USD' && to === 'VES') {
            return amount * rate;
        }
        if (from === 'VES' && to === 'EUR') {
            return amount / rate;
        }
        if (from === 'EUR' && to === 'VES') {
            return amount * rate;
        }
        if ((from === 'USDT' && to === 'USD') || (from === 'USD' && to === 'USDT')) {
            return amount;
        }
        return amount;
    }
};
exports.ExchangeService = ExchangeService;
exports.ExchangeService = ExchangeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [exchange_rate_repository_1.ExchangeRateRepository,
        binance_service_1.BinanceService,
        bcv_scraper_service_1.BcvScraperService])
], ExchangeService);
