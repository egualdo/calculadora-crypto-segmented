"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var BcvScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BcvScraperService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const https_1 = require("https");
let BcvScraperService = BcvScraperService_1 = class BcvScraperService {
    constructor() {
        this.logger = new common_1.Logger(BcvScraperService_1.name);
        this.baseUrl = 'https://www.bcv.org.ve/';
        this.httpService = axios_1.default.create({
            timeout: 10000,
            httpsAgent: new https_1.Agent({ rejectUnauthorized: false }),
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
            const rates = {};
            const $ = cheerio.load(html);
            const normalizeNumber = (value) => {
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
            const extractValueFromRoot = (root) => {
                const strong = root.find('strong').first();
                if (strong.length > 0) {
                    return normalizeNumber(strong.text());
                }
                const rawText = root.text();
                const fallbackMatch = rawText.match(/([\d\.]+,[\d]+)/);
                return fallbackMatch ? normalizeNumber(fallbackMatch[0]) : null;
            };
            let eurVal = null;
            let usdVal = null;
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
            const findValueByKeyword = (keyword, source) => {
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
        }
        catch (error) {
            this.logger.error('BCV scraping error: ' + error.message);
            return null;
        }
    }
};
exports.BcvScraperService = BcvScraperService;
exports.BcvScraperService = BcvScraperService = BcvScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BcvScraperService);
