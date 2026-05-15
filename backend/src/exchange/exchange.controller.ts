import { Body, Controller, Get, Post } from '@nestjs/common';
import { CalculateDto } from './dto/calculate.dto';
import { SaveExchangeRatesDto } from './dto/save-exchange-rates.dto';
import { ExchangeService } from './exchange.service';

@Controller()
export class ExchangeController {
    constructor(private readonly exchangeService: ExchangeService) { }

    @Get('rates')
    async getRates() {
        return this.exchangeService.getLatestRates();
    }

    @Get('historical-rates')
    async getHistoricalRates() {
        return this.exchangeService.getHistoricalRateChartData();
    }

    @Post('calculate')
    async calculate(@Body() calculateDto: CalculateDto) {
        return this.exchangeService.calculate(calculateDto);
    }

    @Post('rates')
    async saveRates(@Body() payload: SaveExchangeRatesDto) {
        return this.exchangeService.saveRates(payload.rates);
    }

    @Post('fetch-rates')
    async fetchAndSaveRates() {
        return this.exchangeService.fetchAndSaveRates();
    }
}
