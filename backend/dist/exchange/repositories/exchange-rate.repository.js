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
exports.ExchangeRateRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exchange_rate_entity_1 = require("../entities/exchange-rate.entity");
let ExchangeRateRepository = class ExchangeRateRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async getLatestRates() {
        const subQuery = this.repository
            .createQueryBuilder('rate')
            .select('MAX(rate.id)', 'id')
            .groupBy('rate.type');
        const rates = await this.repository
            .createQueryBuilder('rate')
            .where(`rate.id IN (${subQuery.getQuery()})`)
            .setParameters(subQuery.getParameters())
            .getMany();
        return rates.map((rate) => this.toInterface(rate));
    }
    async getHistoricalRates() {
        const rows = await this.repository.find({
            where: { type: (0, typeorm_2.In)(['official', 'p2p_sell', 'p2p_buy', 'euro']) },
            order: { createdAt: 'ASC' },
        });
        const grouped = rows.reduce((acc, item) => {
            const date = item.createdAt.toISOString().split('T')[0];
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {});
        const allDates = Array.from(new Set(rows.map((item) => item.createdAt.toISOString().split('T')[0]))).sort();
        const officialData = allDates.map((date) => {
            const dayRows = grouped['official']?.filter((item) => item.createdAt.toISOString().startsWith(date)) || [];
            return dayRows.length ? Number((dayRows.reduce((sum, item) => sum + item.averagePrice, 0) / dayRows.length).toFixed(2)) : null;
        });
        const euroData = allDates.map((date) => {
            const dayRows = grouped['euro']?.filter((item) => item.createdAt.toISOString().startsWith(date)) || [];
            return dayRows.length ? Number((dayRows.reduce((sum, item) => sum + item.averagePrice, 0) / dayRows.length).toFixed(2)) : null;
        });
        const p2pSellData = allDates.map((date) => {
            const dayRows = grouped['p2p_sell']?.filter((item) => item.createdAt.toISOString().startsWith(date)) || [];
            return dayRows.length ? Number((dayRows.reduce((sum, item) => sum + item.averagePrice, 0) / dayRows.length).toFixed(2)) : null;
        });
        const p2pBuyData = allDates.map((date) => {
            const dayRows = grouped['p2p_buy']?.filter((item) => item.createdAt.toISOString().startsWith(date)) || [];
            return dayRows.length ? Number((dayRows.reduce((sum, item) => sum + item.averagePrice, 0) / dayRows.length).toFixed(2)) : null;
        });
        const averageData = allDates.map((_, index) => {
            const officialValue = officialData[index];
            const p2pValue = p2pSellData[index];
            if (officialValue === null || p2pValue === null) {
                return null;
            }
            return Number(((officialValue + p2pValue) / 2).toFixed(2));
        });
        return {
            labels: allDates,
            datasets: [
                {
                    label: 'Dólar Oficial',
                    data: officialData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.2,
                    pointRadius: 3,
                },
                {
                    label: 'USDT P2P Venta',
                    data: p2pSellData,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: false,
                    tension: 0.2,
                    pointRadius: 3,
                },
                {
                    label: 'Promedio Dólar',
                    data: averageData,
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.12)',
                    fill: false,
                    tension: 0.2,
                    pointRadius: 3,
                    borderWidth: 2,
                },
            ],
        };
    }
    async saveRates(rates) {
        const entities = rates.map((rate) => {
            const entity = new exchange_rate_entity_1.ExchangeRateEntity();
            entity.type = rate.type;
            entity.currencyPair = rate.currency_pair;
            entity.buyPrice = rate.buy_price;
            entity.sellPrice = rate.sell_price;
            entity.averagePrice = rate.average_price;
            entity.metadata = rate.metadata;
            entity.lastUpdated = new Date(rate.last_updated);
            return entity;
        });
        const saved = await this.repository.save(entities);
        return saved.map((rate) => this.toInterface(rate));
    }
    toInterface(entity) {
        return {
            type: entity.type,
            currency_pair: entity.currencyPair,
            buy_price: Number(entity.buyPrice),
            sell_price: Number(entity.sellPrice),
            average_price: Number(entity.averagePrice),
            metadata: entity.metadata,
            last_updated: entity.lastUpdated.toISOString(),
        };
    }
};
exports.ExchangeRateRepository = ExchangeRateRepository;
exports.ExchangeRateRepository = ExchangeRateRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exchange_rate_entity_1.ExchangeRateEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExchangeRateRepository);
