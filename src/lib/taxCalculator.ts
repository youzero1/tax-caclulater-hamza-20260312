export type FilingStatus =
  | 'single'
  | 'married_jointly'
  | 'married_separately'
  | 'head_of_household';

export interface TaxBracket {
  rate: number;
  min: number;
  max: number | null;
}

export interface BracketBreakdown {
  rate: number;
  taxableAmount: number;
  taxAmount: number;
  min: number;
  max: number | null;
}

export interface TaxCalculationResult {
  grossIncome: number;
  filingStatus: FilingStatus;
  taxYear: number;
  deductions: number;
  taxableIncome: number;
  federalTax: number;
  effectiveRate: number;
  marginalRate: number;
  takeHomePay: number;
  bracketBreakdown: BracketBreakdown[];
  standardDeduction: number;
}

const TAX_BRACKETS: Record<number, Record<FilingStatus, TaxBracket[]>> = {
  2023: {
    single: [
      { rate: 0.10, min: 0, max: 11000 },
      { rate: 0.12, min: 11000, max: 44725 },
      { rate: 0.22, min: 44725, max: 95375 },
      { rate: 0.24, min: 95375, max: 182050 },
      { rate: 0.32, min: 182050, max: 231250 },
      { rate: 0.35, min: 231250, max: 578125 },
      { rate: 0.37, min: 578125, max: null },
    ],
    married_jointly: [
      { rate: 0.10, min: 0, max: 22000 },
      { rate: 0.12, min: 22000, max: 89450 },
      { rate: 0.22, min: 89450, max: 190750 },
      { rate: 0.24, min: 190750, max: 364200 },
      { rate: 0.32, min: 364200, max: 462500 },
      { rate: 0.35, min: 462500, max: 693750 },
      { rate: 0.37, min: 693750, max: null },
    ],
    married_separately: [
      { rate: 0.10, min: 0, max: 11000 },
      { rate: 0.12, min: 11000, max: 44725 },
      { rate: 0.22, min: 44725, max: 95375 },
      { rate: 0.24, min: 95375, max: 182050 },
      { rate: 0.32, min: 182050, max: 231250 },
      { rate: 0.35, min: 231250, max: 346875 },
      { rate: 0.37, min: 346875, max: null },
    ],
    head_of_household: [
      { rate: 0.10, min: 0, max: 15700 },
      { rate: 0.12, min: 15700, max: 59850 },
      { rate: 0.22, min: 59850, max: 95350 },
      { rate: 0.24, min: 95350, max: 182050 },
      { rate: 0.32, min: 182050, max: 231250 },
      { rate: 0.35, min: 231250, max: 578100 },
      { rate: 0.37, min: 578100, max: null },
    ],
  },
  2024: {
    single: [
      { rate: 0.10, min: 0, max: 11600 },
      { rate: 0.12, min: 11600, max: 47150 },
      { rate: 0.22, min: 47150, max: 100525 },
      { rate: 0.24, min: 100525, max: 191950 },
      { rate: 0.32, min: 191950, max: 243725 },
      { rate: 0.35, min: 243725, max: 609350 },
      { rate: 0.37, min: 609350, max: null },
    ],
    married_jointly: [
      { rate: 0.10, min: 0, max: 23200 },
      { rate: 0.12, min: 23200, max: 94300 },
      { rate: 0.22, min: 94300, max: 201050 },
      { rate: 0.24, min: 201050, max: 383900 },
      { rate: 0.32, min: 383900, max: 487450 },
      { rate: 0.35, min: 487450, max: 731200 },
      { rate: 0.37, min: 731200, max: null },
    ],
    married_separately: [
      { rate: 0.10, min: 0, max: 11600 },
      { rate: 0.12, min: 11600, max: 47150 },
      { rate: 0.22, min: 47150, max: 100525 },
      { rate: 0.24, min: 100525, max: 191950 },
      { rate: 0.32, min: 191950, max: 243725 },
      { rate: 0.35, min: 243725, max: 365600 },
      { rate: 0.37, min: 365600, max: null },
    ],
    head_of_household: [
      { rate: 0.10, min: 0, max: 16550 },
      { rate: 0.12, min: 16550, max: 63100 },
      { rate: 0.22, min: 63100, max: 100500 },
      { rate: 0.24, min: 100500, max: 191950 },
      { rate: 0.32, min: 191950, max: 243700 },
      { rate: 0.35, min: 243700, max: 609350 },
      { rate: 0.37, min: 609350, max: null },
    ],
  },
};

const STANDARD_DEDUCTIONS: Record<number, Record<FilingStatus, number>> = {
  2023: {
    single: 13850,
    married_jointly: 27700,
    married_separately: 13850,
    head_of_household: 20800,
  },
  2024: {
    single: 14600,
    married_jointly: 29200,
    married_separately: 14600,
    head_of_household: 21900,
  },
};

export function getStandardDeduction(
  taxYear: number,
  filingStatus: FilingStatus
): number {
  return STANDARD_DEDUCTIONS[taxYear]?.[filingStatus] ?? 13850;
}

export function calculateTax(
  grossIncome: number,
  filingStatus: FilingStatus,
  taxYear: number,
  customDeduction?: number
): TaxCalculationResult {
  const standardDeduction = getStandardDeduction(taxYear, filingStatus);
  const deductions =
    customDeduction !== undefined && customDeduction > 0
      ? customDeduction
      : standardDeduction;

  const taxableIncome = Math.max(0, grossIncome - deductions);

  const brackets = TAX_BRACKETS[taxYear]?.[filingStatus];
  if (!brackets) {
    throw new Error(`Invalid tax year or filing status: ${taxYear}, ${filingStatus}`);
  }

  let federalTax = 0;
  let marginalRate = 0;
  const bracketBreakdown: BracketBreakdown[] = [];

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;

    const bracketMax = bracket.max ?? Infinity;
    const taxableInBracket = Math.min(taxableIncome, bracketMax) - bracket.min;

    if (taxableInBracket <= 0) continue;

    const taxInBracket = taxableInBracket * bracket.rate;
    federalTax += taxInBracket;
    marginalRate = bracket.rate;

    bracketBreakdown.push({
      rate: bracket.rate,
      taxableAmount: taxableInBracket,
      taxAmount: taxInBracket,
      min: bracket.min,
      max: bracket.max,
    });
  }

  const effectiveRate = grossIncome > 0 ? federalTax / grossIncome : 0;
  const takeHomePay = grossIncome - federalTax;

  return {
    grossIncome,
    filingStatus,
    taxYear,
    deductions,
    taxableIncome,
    federalTax: Math.round(federalTax * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    marginalRate,
    takeHomePay: Math.round(takeHomePay * 100) / 100,
    bracketBreakdown,
    standardDeduction,
  };
}
