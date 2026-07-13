import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/formatCurrency';
import { staggerContainer, staggerItem, gentle } from '@/utils/animations';
import StatCard from '@/components/dashboard/StatCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import CategoryChart from '@/components/dashboard/CategoryChart';
import ErrorState from '@/components/ui/ErrorState';
import SectionHeader from '@/components/ui/SectionHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();
  const { user } = useAuth();
  const currency = useCurrency();

  if (isError) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        description="We couldn't fetch your financial data. Please try again."
        retry={() => { refetch(); }}
      />
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';
  const netSavings = (stats?.monthlyIncome ?? 0) - (stats?.monthlyExpenses ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back{firstName !== 'there' ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your finances</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Plus size={13} />
            <span className="hidden xs:inline">Add</span> Transaction
          </Link>
          <Link
            to="/analytics"
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-sm"
          >
            <BarChart3 size={13} />
            Analytics
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem} transition={gentle}>
            <StatCard
              title="Total Balance"
              value={formatCurrency(stats?.totalBalance ?? 0, currency)}
              icon={<Wallet size={18} />}
              variant="info"
              trend="All time net worth"
            />
          </motion.div>
          <motion.div variants={staggerItem} transition={gentle}>
            <StatCard
              title="Income"
              value={formatCurrency(stats?.monthlyIncome ?? 0, currency)}
              icon={<TrendingUp size={18} />}
              variant="success"
              trend="This month"
            />
          </motion.div>
          <motion.div variants={staggerItem} transition={gentle}>
            <StatCard
              title="Expenses"
              value={formatCurrency(stats?.monthlyExpenses ?? 0, currency)}
              icon={<TrendingDown size={18} />}
              variant="danger"
              trend="This month"
            />
          </motion.div>
          <motion.div variants={staggerItem} transition={gentle}>
            <StatCard
              title="Net Savings"
              value={formatCurrency(netSavings, currency)}
              icon={<PiggyBank size={18} />}
              variant="default"
              trend={netSavings >= 0 ? '🎉 You\'re saving!' : 'Spending exceeds income'}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div>
        <div className="mb-4">
          <SectionHeader
            title="Overview"
            action={
              <Link
                to="/analytics"
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
              >
                Detailed analytics <ArrowRight size={12} />
              </Link>
            }
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MonthlyChart />
          </div>
          <div>
            <CategoryChart />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="mb-4">
          <SectionHeader title="Activity" />
        </div>
        <RecentTransactions />
      </div>
    </div>
  );
}
