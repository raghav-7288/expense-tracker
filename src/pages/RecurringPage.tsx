import { useState } from 'react';
import {
  useRecurringTransactions,
  useCreateRecurringTransaction,
} from '@/hooks/useRecurringTransactions';
import RecurringList from '@/components/recurring/RecurringList';
import RecurringForm, { type RecurringFormData } from '@/components/recurring/RecurringForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import AnimatedPage from '@/components/ui/AnimatedPage';
import PageHeader from '@/components/ui/PageHeader';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Plus, Repeat } from 'lucide-react';

export default function RecurringPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: rules, isLoading, isError, refetch } = useRecurringTransactions();
  const createMutation = useCreateRecurringTransaction();

  async function handleCreate(data: RecurringFormData) {
    await createMutation.mutateAsync({
      type: data.type,
      amount: data.amount,
      notes: data.notes,
      category_id: data.category_id ?? null,
      account_id: data.account_id ?? null,
      frequency: data.frequency,
      start_date: data.start_date,
      end_date: data.end_date ?? null,
    });
    setShowForm(false);
  }

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title="Recurring"
        description="Automate transactions that repeat on a schedule"
        action={
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus size={16} />
            <span>Add</span>
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          title="Failed to load recurring transactions"
          description="We couldn't fetch your recurring schedules. Please try again."
          retry={() => { refetch(); }}
        />
      ) : isLoading ? (
        <SkeletonTable rows={4} />
      ) : !rules || rules.length === 0 ? (
        <EmptyState
          icon={<Repeat size={28} />}
          title="No recurring transactions yet"
          description="Schedule a payment to repeat weekly, monthly, or yearly and it'll be added automatically. Perfect for rent, salary, and subscriptions."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Schedule Your First One
            </Button>
          }
        />
      ) : (
        <RecurringList rules={rules} />
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Recurring Transaction"
      >
        <RecurringForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </AnimatedPage>
  );
}

