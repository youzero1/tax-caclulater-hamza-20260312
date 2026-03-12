import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { TaxCalculation } from '@/lib/entities/TaxCalculation';
import { calculateTax, FilingStatus } from '@/lib/taxCalculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grossIncome, filingStatus, taxYear, deductionType, customDeduction, state } = body;

    if (!grossIncome || grossIncome < 0) {
      return NextResponse.json(
        { error: 'Invalid gross income' },
        { status: 400 }
      );
    }

    if (!['single', 'married_jointly', 'married_separately', 'head_of_household'].includes(filingStatus)) {
      return NextResponse.json(
        { error: 'Invalid filing status' },
        { status: 400 }
      );
    }

    if (![2023, 2024].includes(taxYear)) {
      return NextResponse.json(
        { error: 'Invalid tax year. Must be 2023 or 2024.' },
        { status: 400 }
      );
    }

    const customDeductionAmount =
      deductionType === 'custom' && customDeduction > 0
        ? Number(customDeduction)
        : undefined;

    const result = calculateTax(
      Number(grossIncome),
      filingStatus as FilingStatus,
      Number(taxYear),
      customDeductionAmount
    );

    const ds = await getDataSource();
    const repo = ds.getRepository(TaxCalculation);

    const record = repo.create({
      grossIncome: result.grossIncome,
      filingStatus: result.filingStatus,
      taxYear: result.taxYear,
      deductions: result.deductions,
      federalTax: result.federalTax,
      effectiveRate: result.effectiveRate,
      marginalRate: result.marginalRate,
      takeHomePay: result.takeHomePay,
      state: state || null,
    });

    await repo.save(record);

    return NextResponse.json({ ...result, id: record.id, createdAt: record.createdAt });
  } catch (error) {
    console.error('Calculate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
