import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRateEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 50 })
    type!: string;

    @Column({ name: 'currency_pair', length: 50 })
    currencyPair!: string;

    @Column('decimal', { precision: 18, scale: 4 })
    buyPrice!: number;

    @Column('decimal', { precision: 18, scale: 4 })
    sellPrice!: number;

    @Column('decimal', { precision: 18, scale: 4 })
    averagePrice!: number;

    @Column('json', { nullable: true })
    metadata?: Record<string, unknown>;

    @Column({ name: 'last_updated', type: 'timestamp' })
    lastUpdated!: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;
}
