import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class BcvScraperService {
    private readonly logger = new Logger(BcvScraperService.name);
    private readonly httpService: AxiosInstance;
    private readonly scraperServiceUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.scraperServiceUrl = this.configService.get<string>('SCRAPER_SERVICE_URL', 'http://localhost:8000');
        this.httpService = axios.create({
            timeout: 15000, // 15 seconds to allow Python service to scrape BCV and respond
        });
    }

    async getRates() {
        try {
            const url = `${this.scraperServiceUrl}/bcv`;
            this.logger.log(`Fetching BCV exchange rates from microservice: ${url}`);
            const response = await this.httpService.get(url);

            if (response.status !== 200) {
                throw new Error('BCV scraper service returned status ' + response.status);
            }

            return response.data;
        } catch (error) {
            this.logger.error('BCV scraping error: ' + (error as Error).message);
            return null;
        }
    }
}