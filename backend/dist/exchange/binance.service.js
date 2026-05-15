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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var BinanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let BinanceService = BinanceService_1 = class BinanceService {
    constructor() {
        this.logger = new common_1.Logger(BinanceService_1.name);
        this.baseUrl = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
        this.httpService = axios_1.default.create({
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    async getP2PRates(type = 'buy', rows = 10) {
        try {
            const requestData = {
                proMerchantAds: false,
                page: 1,
                rows,
                payTypes: [], // Todos los métodos de pago
                publisherType: null,
                fiat: 'VES',
                tradeType: type.toUpperCase(),
                asset: 'USDT',
                countries: ['VE'],
                transAmount: '',
            };
            const response = await this.httpService.post(this.baseUrl, requestData);
            if (response.status !== 200) {
                throw new Error(`Binance API error: ${response.status}`);
            }
            const data = response.data;
            return this.processP2PData(data.data || []);
        }
        catch (error) {
            this.logger.error('Error fetching Binance P2P rates: ' + error.message);
            return null;
        }
    }
    processP2PData(data) {
        if (!data || data.length === 0) {
            return null;
        }
        const prices = [];
        let totalAvailable = 0;
        for (const offer of data) {
            const price = parseFloat(offer.adv.price);
            const available = parseFloat(offer.adv.tradableQuantity);
            prices.push(price);
            totalAvailable += available;
        }
        // Precio promedio ponderado por disponibilidad
        const weightedAvg = this.calculateWeightedAverage(data);
        return {
            min_price: Math.min(...prices),
            max_price: Math.max(...prices),
            avg_price: prices.reduce((sum, p) => sum + p, 0) / prices.length,
            weighted_avg: weightedAvg,
            total_offers: data.length,
            total_available: totalAvailable,
            offers: data.slice(0, 5), // Primeras 5 ofertas
        };
    }
    calculateWeightedAverage(offers) {
        let totalValue = 0;
        let totalWeight = 0;
        for (const offer of offers) {
            const price = parseFloat(offer.adv.price);
            const available = parseFloat(offer.adv.tradableQuantity);
            totalValue += price * available;
            totalWeight += available;
        }
        return totalWeight > 0 ? totalValue / totalWeight : 0;
    }
};
exports.BinanceService = BinanceService;
exports.BinanceService = BinanceService = BinanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BinanceService);
