import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class BinanceService {
    private readonly logger = new Logger(BinanceService.name);
    private readonly baseUrl = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
    private readonly httpService: AxiosInstance;

    constructor() {
        this.httpService = axios.create({
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async getP2PRates(type: 'buy' | 'sell' = 'buy', rows: number = 10) {
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
        } catch (error) {
            this.logger.error('Error fetching Binance P2P rates: ' + (error as Error).message);
            return null;
        }
    }

    private processP2PData(data: any[]) {
        if (!data || data.length === 0) {
            return null;
        }

        const prices: number[] = [];
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

    private calculateWeightedAverage(offers: any[]): number {
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
}