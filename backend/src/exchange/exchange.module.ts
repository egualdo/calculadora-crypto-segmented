import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeController } from './exchange.controller';
import { ExchangeRateEntity } from './entities/exchange-rate.entity';
import { ExchangeRateRepository } from './repositories/exchange-rate.repository';
import { ExchangeService } from './exchange.service';
import { BinanceService } from './binance.service';
import { BcvScraperService } from './bcv-scraper.service';

@Module({
    imports: [TypeOrmModule.forFeature([ExchangeRateEntity])],
    controllers: [ExchangeController],
    providers: [ExchangeService, ExchangeRateRepository, BinanceService, BcvScraperService],
    exports: [ExchangeRateRepository],
})
export class ExchangeModule { }
