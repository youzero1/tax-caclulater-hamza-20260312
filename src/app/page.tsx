'use client';

import { useState, useEffect, useCallback } from 'react';

type FilingStatus = 'single' | 'married_jointly' | 'married_separately' | 'head_of_household';

interface BracketBreakdown {
  rate: number;
  taxableAmount: number;
  taxAmount: number;
  min: number;
  max: number | null;
}

interface TaxResult {
  id: number;
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
  createdAt: string;
}

interface HistoryRecord {
  id: number;
  grossIncome: number;
  filingStatus: string;
  taxYear: number;
  deductions: number;
  federalTax: number;
  effectiveRate: number;
  marginalRate: number;
  takeHomePay: number;
  state: string | null;
  createdAt: string;
}

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  married_jointly: 'Married Filing Jointly',
  married_separately: 'Married Filing Separately',
  head_of_household: 'Head of Household',
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

const US_STATES = [
  '', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return (value * 100).toFixed(2) + '%';
}

export default function Home() {
  const [grossIncome, setGrossIncome] = useState('');
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [taxYear, setTaxYear] = useState(2024);
  const [deductionType, setDeductionType] = useState<'standard' | 'custom'>('standard');
  const [customDeduction, setCustomDeduction] = useState('');
  const [state, setState] = useState('');
  const [result, setResult] = useState<TaxResult | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const standardDeduction = STANDARD_DEDUCTIONS[taxYear]?.[filingStatus] ?? 0;

  const handleCalculate = async () => {
    setError('');
    if (!grossIncome || isNaN(Number(grossIncome)) || Number(grossIncome) < 0) {
      setError('Please enter a valid gross income.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossIncome: Number(grossIncome),
          filingStatus,
          taxYear,
          deductionType,
          customDeduction: deductionType === 'custom' ? Number(customDeduction) : 0,
          state: state || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Calculation failed.');
      } else {
        setResult(data);
        fetchHistory();
      }
    } catch (e) {
      setError('Network error. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (e) {
      console.error('Failed to clear history', e);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-800 mb-2">🧾 U.S. Tax Calculator</h1>
          <p className="text-gray-600">Calculate your federal income tax for 2023 or 2024</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5 border-b pb-3">Tax Information</h2>

            <div className="space-y-4">
              {/* Gross Income */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Gross Income
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    value={grossIncome}
                    onChange={(e) => setGrossIncome(e.target.value)}
                    placeholder="75000"
                    className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Filing Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="single">Single</option>
                  <option value="married_jointly">Married Filing Jointly</option>
                  <option value="married_separately">Married Filing Separately</option>
                  <option value="head_of_household">Head of Household</option>
                </select>
              </div>

              {/* Tax Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Year</label>
                <select
                  value={taxYear}
                  onChange={(e) => setTaxYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                </select>
              </div>

              {/* Deductions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                <div className="flex gap-3 mb-2">
                  <button
                    onClick={() => setDeductionType('standard')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      deductionType === 'standard'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setDeductionType('custom')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      deductionType === 'custom'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {deductionType === 'standard' ? (
                  <div className="px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
                    Standard deduction: <strong>{formatCurrency(standardDeduction)}</strong> for {FILING_STATUS_LABELS[filingStatus]} ({taxYear})
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      value={customDeduction}
                      onChange={(e) => setCustomDeduction(e.target.value)}
                      placeholder="Enter custom deduction"
                      className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* State (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select State --</option>
                  {US_STATES.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-lg transition-colors text-base"
              >
                {loading ? 'Calculating...' : 'Calculate Tax'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-5 border-b pb-3">Tax Results</h2>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Federal Tax</p>
                    <p className="text-xl font-bold text-indigo-700">{formatCurrency(result.federalTax)}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-green-500 font-medium uppercase tracking-wide">Take-Home Pay</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(result.takeHomePay)}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-yellow-600 font-medium uppercase tracking-wide">Effective Rate</p>
                    <p className="text-xl font-bold text-yellow-700">{formatPercent(result.effectiveRate)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-orange-500 font-medium uppercase tracking-wide">Marginal Rate</p>
                    <p className="text-xl font-bold text-orange-700">{formatPercent(result.marginalRate)}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gross Income</span>
                    <span className="font-medium">{formatCurrency(result.grossIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Deductions</span>
                    <span className="font-medium text-green-600">- {formatCurrency(result.deductions)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-700 font-medium">Taxable Income</span>
                    <span className="font-bold">{formatCurrency(result.taxableIncome)}</span>
                  </div>
                </div>

                {/* Bracket Breakdown */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Tax Bracket Breakdown</h3>
                  <div className="space-y-1">
                    {result.bracketBreakdown.map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-12 text-center bg-indigo-100 text-indigo-700 rounded px-1 py-0.5 font-semibold">
                            {(b.rate * 100).toFixed(0)}%
                          </span>
                          <span className="text-gray-500">
                            {formatCurrency(b.min)} – {b.max ? formatCurrency(b.max) : '∞'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">{formatCurrency(b.taxableAmount)}</span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span className="font-semibold text-gray-800">{formatCurrency(b.taxAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Results Yet</h3>
                <p className="text-gray-400 text-sm">Fill in the form and click "Calculate Tax" to see your results.</p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-5 border-b pb-3">
            <h2 className="text-xl font-semibold text-gray-800">📜 Calculation History</h2>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          {historyLoading ? (
            <div className="text-center py-8 text-gray-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🗂️</div>
              <p>No calculations saved yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Gross Income</th>
                    <th className="pb-2 pr-4">Filing Status</th>
                    <th className="pb-2 pr-4">Year</th>
                    <th className="pb-2 pr-4">Deductions</th>
                    <th className="pb-2 pr-4">Federal Tax</th>
                    <th className="pb-2 pr-4">Eff. Rate</th>
                    <th className="pb-2">Take-Home</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">
                        {new Date(record.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2 pr-4 font-medium">{formatCurrency(record.grossIncome)}</td>
                      <td className="py-2 pr-4 text-gray-600">
                        {FILING_STATUS_LABELS[record.filingStatus as FilingStatus] || record.filingStatus}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">{record.taxYear}</td>
                      <td className="py-2 pr-4 text-gray-600">{formatCurrency(record.deductions)}</td>
                      <td className="py-2 pr-4 font-semibold text-red-600">{formatCurrency(record.federalTax)}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-block bg-yellow-100 text-yellow-700 rounded px-2 py-0.5 text-xs font-medium">
                          {formatPercent(record.effectiveRate)}
                        </span>
                      </td>
                      <td className="py-2 font-semibold text-green-600">{formatCurrency(record.takeHomePay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
