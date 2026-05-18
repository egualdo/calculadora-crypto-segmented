import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExchangeService } from './exchange.service';

@Injectable()
export class ExchangeSchedulerService {
    private readonly logger = new Logger(ExchangeSchedulerService.name);

    constructor(private readonly exchangeService: ExchangeService) { }

    /**
     * Scheduled job to fetch new rates every 10 minutes.
     * The rates are compared against latest database entries and saved only on changes.
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async handleRatesSync() {
        this.logger.log('Starting scheduled rates sync from external sources (BCV & Binance)...');
        try {
            const savedRates = await this.exchangeService.fetchAndSaveRates();
            if (savedRates && savedRates.length > 0) {
                this.logger.log(`Scheduled rates sync completed. Saved ${savedRates.length} new changed rates.`);
            } else {
                this.logger.log('Scheduled rates sync completed. No rates have changed, database was not updated.');
            }
        } catch (error) {
            this.logger.error('Error during scheduled rates sync: ' + (error as Error).message);
        }
    }
}
