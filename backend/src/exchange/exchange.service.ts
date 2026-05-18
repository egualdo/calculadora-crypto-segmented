import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CalculateDto } from './dto/calculate.dto';
import { SaveExchangeRatesDto } from './dto/save-exchange-rates.dto';
import { ExchangeRateRepository } from './repositories/exchange-rate.repository';
import { ExchangeRate } from './interfaces/exchange-rate.interface';
import { BinanceService } from './binance.service';
import { BcvScraperService } from './bcv-scraper.service';

@Injectable()
export class ExchangeService {
    private readonly logger = new Logger(ExchangeService.name);

    constructor(
        private readonly repository: ExchangeRateRepository,
        private readonly binanceService: BinanceService,
        private readonly bcvScraperService: BcvScraperService,
    ) { }

    async getLatestRates(): Promise<ExchangeRate[]> {
        this.logger.log('Querying latest exchange rates from database...');
        let rates = await this.repository.getLatestRates();

        // If no rates exist or required types are missing (e.g. first startup), force initial sync
        if (rates.length === 0 || !this.hasRequiredRates(rates)) {
            this.logger.log('Required exchange rates not found in DB. Executing initial sync...');
            await this.fetchAndSaveRates();
            rates = await this.repository.getLatestRates();
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
        
        // Fetch latest stored rates for comparison deduplication
        const latestRates = await this.repository.getLatestRates();

        const shouldSave = (type: string, buy: number, sell: number, average: number): boolean => {
            const latest = latestRates.find((r) => r.type === type);
            if (!latest) {
                return true; // No rate of this type in DB yet, must save
            }
            // Save if there is a difference in buy, sell or average price
            const isDifferent =
                Number(latest.buy_price) !== Number(buy) ||
                Number(latest.sell_price) !== Number(sell) ||
                Number(latest.average_price) !== Number(average);
            
            if (isDifferent) {
                this.logger.log(`Rate change detected for '${type}': DB [Buy:${latest.buy_price}, Sell:${latest.sell_price}] vs New [Buy:${buy}, Sell:${sell}]`);
            }
            return isDifferent;
        };

        // Fetch from BCV
        const bcvRates = await this.bcvScraperService.getRates();
        if (bcvRates) {
            if (bcvRates['official']) {
                const buy = bcvRates['official'].buy;
                const sell = bcvRates['official'].sell;
                const average = bcvRates['official'].average;

                if (shouldSave('official', buy, sell, average)) {
                    ratesToSave.push({
                        type: 'official',
                        currency_pair: 'USD/VES',
                        buy_price: buy,
                        sell_price: sell,
                        average_price: average,
                        metadata: { source: 'bcv.org.ve', name: bcvRates['official'].name },
                        last_updated: bcvRates['official'].last_updated,
                    });
                }
            }
            if (bcvRates['euro']) {
                const buy = bcvRates['euro'].buy;
                const sell = bcvRates['euro'].sell;
                const average = bcvRates['euro'].average;

                if (shouldSave('euro', buy, sell, average)) {
                    ratesToSave.push({
                        type: 'euro',
                        currency_pair: 'EUR/VES',
                        buy_price: buy,
                        sell_price: sell,
                        average_price: average,
                        metadata: { source: 'bcv.org.ve', name: bcvRates['euro'].name },
                        last_updated: bcvRates['euro'].last_updated,
                    });
                }
            }
        }

        // Fetch from Binance P2P
        const binanceBuy = await this.binanceService.getP2PRates('buy');
        if (binanceBuy) {
            const buy = binanceBuy.weighted_avg;
            if (shouldSave('p2p_buy', buy, buy, buy)) {
                ratesToSave.push({
                    type: 'p2p_buy',
                    currency_pair: 'USDT/VES',
                    buy_price: buy,
                    sell_price: buy,
                    average_price: buy,
                    metadata: { source: 'binance.com', offers: binanceBuy.total_offers },
                    last_updated: new Date().toISOString(),
                });
            }
        }

        const binanceSell = await this.binanceService.getP2PRates('sell');
        if (binanceSell) {
            const sell = binanceSell.weighted_avg;
            if (shouldSave('p2p_sell', sell, sell, sell)) {
                ratesToSave.push({
                    type: 'p2p_sell',
                    currency_pair: 'USDT/VES',
                    buy_price: sell,
                    sell_price: sell,
                    average_price: sell,
                    metadata: { source: 'binance.com', offers: binanceSell.total_offers },
                    last_updated: new Date().toISOString(),
                });
            }
        }

        if (ratesToSave.length > 0) {
            this.logger.log(`Saving ${ratesToSave.length} updated exchange rates to database...`);
            return this.repository.saveRates(ratesToSave);
        }

        this.logger.log('No exchange rate changes detected. Database update skipped.');
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
