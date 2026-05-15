export interface ExchangeRate {
    type: string;
    currency_pair: string;
    buy_price: number;
    sell_price: number;
    average_price: number;
    metadata?: Record<string, unknown>;
    last_updated: string;
}
