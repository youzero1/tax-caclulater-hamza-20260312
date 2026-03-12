import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { TaxCalculation } from './entities/TaxCalculation';
import path from 'path';

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.resolve(process.cwd(), 'data', 'tax_calculator.db');

let AppDataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (AppDataSource && AppDataSource.isInitialized) {
    return AppDataSource;
  }

  const { mkdirSync } = await import('fs');
  const dbDir = path.dirname(dbPath);
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch {
    // directory already exists
  }

  AppDataSource = new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [TaxCalculation],
    synchronize: true,
    logging: false,
  });

  await AppDataSource.initialize();
  return AppDataSource;
}
