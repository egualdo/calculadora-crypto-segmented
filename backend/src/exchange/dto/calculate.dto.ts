import { Type } from 'class-transformer';
import { IsIn, IsNumber, Min } from 'class-validator';

export class CalculateDto {
    @Type(() => Number)
    @IsNumber()
    @Min(0.01)
    amount!: number;

    @IsIn(['USDT', 'USD', 'VES', 'EUR'])
    from_currency!: string;

    @IsIn(['USDT', 'USD', 'VES', 'EUR'])
    to_currency!: string;

    @IsIn(['p2p_buy', 'p2p_sell', 'official', 'euro'])
    rate_type!: string;
}
