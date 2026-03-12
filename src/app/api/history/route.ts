import 'reflect-metadata';
import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { TaxCalculation } from '@/lib/entities/TaxCalculation';

export async function GET() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(TaxCalculation);
    const records = await repo.find({
      order: { createdAt: 'DESC' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(TaxCalculation);
    await repo.clear();
    return NextResponse.json({ message: 'History cleared' });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
