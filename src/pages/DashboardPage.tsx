import { useDashboardStats } from '@/hooks/useDashboard';
import { formatCurrency } from '@/utils/formatCurrency';
import StatCard from '@/components/dashboard/StatCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import CategoryChart from '@/components/dashboard/CategoryChart';
import Spinner from '@/components/ui/Spinner';
import { Wallet, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <Spinner size={32} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your financial overview at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(stats?.totalBalance ?? 0)}
          icon={<Wallet size={20} />}
          trend="All time"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(stats?.monthlyIncome ?? 0)}
          icon={<TrendingUp size={20} />}
          variant="success"
          trend="This month"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats?.monthlyExpenses ?? 0)}
          icon={<TrendingDown size={20} />}
          variant="danger"
          trend="This month"
        />
        <StatCard
          title="Monthly Net"
          value={formatCurrency((stats?.monthlyIncome ?? 0) - (stats?.monthlyExpenses ?? 0))}
          icon={<ArrowUpDown size={20} />}
          trend="This month"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyChart />
        </div>
        <div>
          <CategoryChart />
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
}

