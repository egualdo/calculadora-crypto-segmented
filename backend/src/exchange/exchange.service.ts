import { Injectable, NotFoundException } from '@nestjs/common';
import { CalculateDto } from './dto/calculate.dto';
import { SaveExchangeRatesDto } from './dto/save-exchange-rates.dto';
import { ExchangeRateRepository } from './repositories/exchange-rate.repository';
import { ExchangeRate } from './interfaces/exchange-rate.interface';
import { BinanceService } from './binance.service';
import { BcvScraperService } from './bcv-scraper.service';

@Injectable()
export class ExchangeService {
    constructor(
        private readonly repository: ExchangeRateRepository,
        private readonly binanceService: BinanceService,
        private readonly bcvScraperService: BcvScraperService,
    ) { }

    async getLatestRates(): Promise<ExchangeRate[]> {
        // const rates = await this.repository.getLatestRates();
        await this.fetchAndSaveRates();
        const rates = await this.repository.getLatestRates();

        if (!this.hasRequiredRates(rates)) {
            await this.fetchAndSaveRates();
            return this.repository.getLatestRates();
        }

        return rates;
    }

    private hasRequiredRates(rates: ExchangeRate[]) {
        const hasP2PBuy = rates.some((rate) => rate.type === 'p2p_buy');
        const hasP2PSell = rates.some((rate) => rate.type === 'p2p_sell');
        const hasOfficial = rates.some((rate) => rate.type === 'official');
        const hasEuro = rates.some((rate) => rate.type === 'euro');

        return hasP2PBuy && hasP2PSell && (hasOfficial || hasEuro);
    }

    async getHistoricalRateChartData() {
        return this.repository.getHistoricalRates();
    }

    async calculate(dto: CalculateDto) {
        const rates = await this.getLatestRates();
        const rate = rates.find((item) => item.type === dto.rate_type);

        if (!rate) {
            throw new NotFoundException('Tipo de tasa no disponible');
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

    async saveRates(rates: SaveExchangeRatesDto['rates']) {
        return this.repository.saveRates(rates);
    }

    async fetchAndSaveRates() {
        const ratesToSave: SaveExchangeRatesDto['rates'] = [];

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

        if (ratesToSave.length > 0) {
            return this.repository.saveRates(ratesToSave);
        }

        return [];
    }

    private convertCurrency(amount: number, from: string, to: string, rate: number): number {
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
}
