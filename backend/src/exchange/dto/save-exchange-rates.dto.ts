import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { CreateExchangeRateDto } from './create-exchange-rate.dto';

export class SaveExchangeRatesDto {
    @ValidateNested({ each: true })
    @Type(() => CreateExchangeRateDto)
    @ArrayMinSize(1)
    rates!: CreateExchangeRateDto[];
}
