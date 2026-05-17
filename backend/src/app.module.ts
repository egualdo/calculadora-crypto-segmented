import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeModule } from './exchange/exchange.module';
import { ExchangeRateEntity } from './exchange/entities/exchange-rate.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST', 'db'),
                port: Number(configService.get<number>('DB_PORT', 5432)),
                username: configService.get<string>('DB_USER', 'crypto_user'),
                password: configService.get<string>('DB_PASSWORD', 'crypto_pass'),
                database: configService.get<string>('DB_NAME', 'crypto_calculator'),
                entities: [ExchangeRateEntity],
                synchronize: true,
                logging: false,
            }),
        }),
        ExchangeModule,
    ],
})
export class AppModule { }
