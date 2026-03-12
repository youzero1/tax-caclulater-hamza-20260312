import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('tax_calculations')
export class TaxCalculation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 15, scale: 2 })
  grossIncome: number;

  @Column('varchar', { length: 50 })
  filingStatus: string;

  @Column('int')
  taxYear: number;

  @Column('decimal', { precision: 15, scale: 2 })
  deductions: number;

  @Column('decimal', { precision: 15, scale: 2 })
  federalTax: number;

  @Column('decimal', { precision: 10, scale: 4 })
  effectiveRate: number;

  @Column('decimal', { precision: 10, scale: 4 })
  marginalRate: number;

  @Column('decimal', { precision: 15, scale: 2 })
  takeHomePay: number;

  @Column('varchar', { length: 10, nullable: true })
  state: string;

  @CreateDateColumn()
  createdAt: Date;
}
