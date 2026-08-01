import { useState } from 'react';
import { useLoans, useCreateLoan, useLoanSummary } from '@/hooks/useLoans';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';
import LoanList from '@/components/loans/LoanList';
import LoanForm from '@/components/loans/LoanForm';
import LoanFilterBar from '@/components/loans/LoanFilterBar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import AnimatedPage from '@/components/ui/AnimatedPage';
import PageHeader from '@/components/ui/PageHeader';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Plus, HandCoins, ArrowDownLeft, Scale } from 'lucide-react';
import type { LoanFilters } from '@/types';

export default function LoansPage() {
  const [filters, setFilters] = useState<LoanFilters>({});
  const [showForm, setShowForm] = useState(false);

  const { data: loans, isLoading, isError, refetch } = useLoans(filters);
  const { data: summary } = useLoanSummary();
  const createMutation = useCreateLoan();
  const currency = useCurrency();

  async function handleCreate(data: Record<string, unknown>) {
    await createMutation.mutateAsync({
      type: data.type as 'lent' | 'borrowed',
      counterparty_name: data.counterparty_name as string,
      principal_amount: data.principal_amount as number,
      outstanding_amount: data.principal_amount as number,
      account_id: (data.account_id as string) || null,
      due_date: (data.due_date as string) || null,
      notes: (data.notes as string) || null,
    });
    setShowForm(false);
  }

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title="Loans"
        description="Track money lent and borrowed"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            <span className="sm:inline">New Loan</span>
          </Button>
        }
      />

      {/* Summary Stats */}
      {summary && (summary.activeLoansCount > 0 || summary.settledLoansCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <HandCoins size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">To Receive</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.outstandingLent, currency)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">To Pay Back</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.outstandingBorrowed, currency)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
              <Scale size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Net Position</p>
              <p
                className={cn(
                  'text-lg font-bold',
                  summary.netReceivable > 0 ? 'text-emerald-600' : summary.netReceivable < 0 ? 'text-red-600' : 'text-gray-900',
                )}
              >
                {summary.netReceivable >= 0 ? '+' : ''}{formatCurrency(summary.netReceivable, currency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <LoanFilterBar
        filters={filters}
        onChange={setFilters}
        resultCount={loans?.length}
      />

      {/* Content */}
      {isError ? (
        <ErrorState
          title="Failed to load loans"
          description="We couldn't fetch your loan data. Please try again."
          retry={() => { refetch(); }}
        />
      ) : isLoading ? (
        <SkeletonTable rows={4} />
      ) : !loans || loans.length === 0 ? (
        <EmptyState
          icon={<HandCoins size={28} />}
          title={
            filters.search || (filters.type && filters.type !== 'all') || (filters.status && filters.status !== 'all')
              ? 'No matching loans'
              : 'No loans yet'
          }
          description={
            filters.search || (filters.type && filters.type !== 'all') || (filters.status && filters.status !== 'all')
              ? 'Try adjusting your filters to see results.'
              : 'Start tracking money you\'ve lent or borrowed. Record a loan to get started!'
          }
          action={
            filters.search || (filters.type && filters.type !== 'all') || (filters.status && filters.status !== 'all') ? (
              <Button variant="secondary" size="sm" onClick={() => setFilters({})}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setShowForm(true)}>
                <Plus size={16} />
                Record Your First Loan
              </Button>
            )
          }
        />
      ) : (
        <LoanList loans={loans} />
      )}

      {/* Create Loan Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Record a Loan"
      >
        <LoanForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </AnimatedPage>
  );
}

