import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { Agent as HttpsAgent } from 'https';

@Injectable()
export class BcvScraperService {
    private readonly logger = new Logger(BcvScraperService.name);
    private readonly baseUrl = 'https://www.bcv.org.ve/';
    private readonly httpService: AxiosInstance;

    constructor() {
        this.httpService = axios.create({
            timeout: 10000,
            httpsAgent: new HttpsAgent({ rejectUnauthorized: false }),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });
    }

    async getRates() {
        try {
            const response = await this.httpService.get(this.baseUrl);

            if (response.status !== 200) {
                throw new Error('BCV fetch failed: ' + response.status);
            }

            const html = response.data;
            const rates: any = {};

            const $ = cheerio.load(html);

            const normalizeNumber = (value: string): number | null => {
                if (!value) {
                    return null;
                }
                const cleaned = value
                    .replace(/\s/g, '')
                    .replace(/\./g, '')
                    .replace(',', '.');
                const match = cleaned.match(/[\d\.\-]+/);
                return match ? parseFloat(match[0]) : null;
            };

            const extractValueFromRoot = (root: cheerio.Cheerio) => {
                const strong = root.find('strong').first();
                if (strong.length > 0) {
                    return normalizeNumber(strong.text());
                }
                const rawText = root.text();
                const fallbackMatch = rawText.match(/([\d\.]+,[\d]+)/);
                return fallbackMatch ? normalizeNumber(fallbackMatch[0]) : null;
            };

            let eurVal: number | null = null;
            let usdVal: number | null = null;

            const recuadroElements = $('[id*="recuadrotsmc"], .recuadrotsmc');
            recuadroElements.each((_, element) => {
                const root = $(element);
                const text = root.text();

                if (!usdVal && /d[oó]lar|usd|dollar/i.test(text)) {
                    usdVal = extractValueFromRoot(root) ?? usdVal;
                }

                if (!eurVal && /euro|eur/i.test(text)) {
                    eurVal = extractValueFromRoot(root) ?? eurVal;
                }
            });

            const findValueByKeyword = (keyword: string, source: string) => {
                const pattern = new RegExp(keyword + '[^\\d\\-]{0,80}([\\d\\.,]+)', 'iu');
                const match = source.match(pattern);
                if (match) {
                    return normalizeNumber(match[1]);
                }
                const pattern2 = new RegExp('1\\s*(?:' + keyword + '|[A-Z]{3})[^\\d]{0,20}([\\d\\.,]+)', 'iu');
                const match2 = source.match(pattern2);
                if (match2) {
                    return normalizeNumber(match2[1]);
                }
                return null;
            };

            if (!usdVal) {
                const usdKeywords = ['Dólar', 'Dolar', 'USD'];
                for (const keyword of usdKeywords) {
                    const value = findValueByKeyword(keyword, html);
                    if (value !== null && value > 0) {
                        usdVal = value;
                        break;
                    }
                }
            }

            if (!eurVal) {
                const eurKeywords = ['Euro', 'EUR'];
                for (const keyword of eurKeywords) {
                    const value = findValueByKeyword(keyword, html);
                    if (value !== null && value > 0) {
                        eurVal = value;
                        break;
                    }
                }
            }

            if (usdVal !== null) {
                rates['official'] = {
                    buy: usdVal,
                    sell: usdVal,
                    average: usdVal,
                    name: 'BCV Dólar Oficial',
                    last_updated: new Date().toISOString(),
                    source: 'bcv.org.ve',
                };
            }

            if (eurVal !== null) {
                rates['euro'] = {
                    buy: eurVal,
                    sell: eurVal,
                    average: eurVal,
                    name: 'BCV Euro',
                    last_updated: new Date().toISOString(),
                    source: 'bcv.org.ve',
                };
            }

            return rates;
        } catch (error) {
            this.logger.error('BCV scraping error: ' + (error as Error).message);
            return null;
        }
    }
}