import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateExchangeRateDto {
    @IsString()
    @IsIn(['p2p_buy', 'p2p_sell', 'official', 'euro'])
    type!: string;

    @IsString()
    currency_pair!: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    buy_price!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    sell_price!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    average_price!: number;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;

    @IsDateString()
    last_updated!: string;
}
