import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateExchangeRateDto } from '../dto/create-exchange-rate.dto';
import { ExchangeRateEntity } from '../entities/exchange-rate.entity';
import { ExchangeRate } from '../interfaces/exchange-rate.interface';

@Injectable()
export class ExchangeRateRepository {
    constructor(
        @InjectRepository(ExchangeRateEntity)
        private readonly repository: Repository<ExchangeRateEntity>,
    ) { }

    async getLatestRates(): Promise<ExchangeRate[]> {
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
            where: { type: In(['official', 'p2p_sell', 'p2p_buy', 'euro']) },
            order: { createdAt: 'ASC' },
        });

        const grouped = rows.reduce<Record<string, ExchangeRateEntity[]>>((acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {});

        const allDates = Array.from(
            new Set(rows.map((item) => item.createdAt.toISOString().split('T')[0])),
        ).sort();

        const officialData = allDates.map((date) => {
            const dayRows = grouped['official']?.filter((item) => item.createdAt.toISOString().startsWith(date)) || [];
            return dayRows.length ? Number((dayRows.reduce((sum, item) => sum + item.averagePrice, 0) / dayRows.length).toFixed(2)) : null;
        });

        const p2pSellData = allDates.map((date) => {
            const dayRows = grouped['p2p_sell']?.filter((item) => item.createdAt.toISOString().startsWith(date)) || [];
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

    async saveRates(rates: CreateExchangeRateDto[]) {
        const entities = rates.map((rate) => {
            const entity = new ExchangeRateEntity();
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

    private toInterface(entity: ExchangeRateEntity): ExchangeRate {
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
}
