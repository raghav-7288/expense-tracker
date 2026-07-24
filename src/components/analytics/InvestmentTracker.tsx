import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, PiggyBank } from 'lucide-react';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';
import type { Transaction } from '@/types';

interface InvestmentTrackerProps {
  transactions: Transaction[];
  currency: string;
}

interface MonthlyInvestment {
  month: string;
  label: string;
  amount: number;
}

function computeMonthlyInvestments(transactions: Transaction[]): MonthlyInvestment[] {
  // Filter transactions with "Investments" category (case-insensitive)
  const investmentTxns = transactions.filter(
    (t) => t.categories?.name?.toLowerCase().includes('invest'),
  );

  const map = new Map<string, number>();

  for (const t of investmentTxns) {
    const d = new Date(t.date + 'T00:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    map.set(key, (map.get(key) ?? 0) + Number(t.amount));
  }

  // Sort by date and take last 6 months
  const sorted = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  return sorted.map(([month, amount]) => {
    const d = new Date(month + 'T00:00:00');
    const label = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(d);
    return { month, label, amount };
  });
}

export default function InvestmentTracker({ transactions, currency }: InvestmentTrackerProps) {
  const investmentTxns = useMemo(
    () => transactions.filter((t) => t.categories?.name?.toLowerCase().includes('invest')),
    [transactions],
  );

  const monthlyData = useMemo(
    () => computeMonthlyInvestments(transactions),
    [transactions],
  );

  const totalInvested = useMemo(
    () => investmentTxns.reduce((sum, t) => sum + Number(t.amount), 0),
    [investmentTxns],
  );

  const thisMonthAmount = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return investmentTxns
      .filter((t) => t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [investmentTxns]);

  const avgMonthly = monthlyData.length > 0
    ? monthlyData.reduce((sum, m) => sum + m.amount, 0) / monthlyData.length
    : 0;

  const empty = investmentTxns.length === 0;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <PiggyBank size={14} className="text-amber-600" />
            </div>
            <span className="text-xs text-gray-500">Total Invested</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalInvested, currency)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-500">This Month</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(thisMonthAmount, currency)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">Monthly Avg</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(avgMonthly, currency)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Monthly Investments"
          description="Amount invested each month"
          empty={empty}
          emptyMessage="No investment transactions yet. Categorize transactions under 'Investments' to track them here."
          emptyIcon={<TrendingUp size={18} />}
        >
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  formatter={(value) => [formatCompactCurrency(Number(value), currency), 'Invested']}
                />
                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Investment Trend"
          description="Cumulative investment growth"
          empty={empty}
          emptyMessage="Start investing to see your growth trend."
          emptyIcon={<TrendingUp size={18} />}
        >
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData.reduce<{ label: string; cumulative: number }[]>((acc, m) => {
                  const prev = acc.length > 0 ? acc[acc.length - 1]!.cumulative : 0;
                  acc.push({ label: m.label, cumulative: prev + m.amount });
                  return acc;
                }, [])}
                margin={{ top: 5, right: 5, left: -5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  formatter={(value) => [formatCompactCurrency(Number(value), currency), 'Total']}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Recent investment transactions */}
      {investmentTxns.length > 0 && (
        <ChartCard title="Recent Investments" description="Latest investment transactions">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {investmentTxns
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((t) => (
                <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                      t.type === 'income' ? 'bg-green-50' : 'bg-amber-50',
                    )}>
                      <TrendingUp size={12} className={t.type === 'income' ? 'text-green-600' : 'text-amber-600'} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.notes}</p>
                      <p className="text-[11px] text-gray-400">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
                          new Date(t.date + 'T00:00:00'),
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-semibold',
                    t.type === 'income' ? 'text-green-600' : 'text-amber-700',
                  )}>
                    {t.type === 'income' ? '+' : ''}{formatCurrency(Number(t.amount), currency)}
                  </span>
                </div>
              ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

