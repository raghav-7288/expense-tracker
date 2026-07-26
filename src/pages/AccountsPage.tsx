import { useState } from 'react';
import { useAccounts, useAccountBalances, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/useAccounts';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';
import AnimatedPage from '@/components/ui/AnimatedPage';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import AccountForm from '@/components/accounts/AccountForm';
import { Plus, Wallet, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import type { Account } from '@/types';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  cash: 'Cash',
  investment: 'Investment',
  other: 'Other',
};

export default function AccountsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const currency = useCurrency();

  const { data: accounts, isLoading } = useAccounts();
  const { data: balances } = useAccountBalances();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  async function handleCreate(data: Record<string, unknown>) {
    await createMutation.mutateAsync({
      name: data.name as string,
      type: data.type as Account['type'],
      initial_balance: data.initial_balance as number,
      color: data.color as string,
      icon: data.icon as string,
    });
    setShowForm(false);
  }

  async function handleUpdate(data: Record<string, unknown>) {
    if (!editingAccount) return;
    await updateMutation.mutateAsync({
      id: editingAccount.id,
      input: {
        name: data.name as string,
        type: data.type as Account['type'],
        initial_balance: data.initial_balance as number,
        color: data.color as string,
        icon: data.icon as string,
      },
    });
    setEditingAccount(null);
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
    setDeletingId(null);
  }

  const totalNetWorth = (balances ?? []).reduce((sum, b) => sum + b.balance, 0);

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Track balances across your bank accounts and wallets"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Account
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={28} />}
          title="Track your money across accounts"
          description="Add your bank accounts, wallets, or savings to see where your money lives."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Add Your First Account
            </Button>
          }
        />
      ) : (
        <>
          {/* Total Net Worth */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Net Worth</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalNetWorth, currency)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Wallet size={20} className="text-primary-600" />
              </div>
            </div>
          </Card>

          {/* Account Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const balanceEntry = balances?.find((b) => b.account.id === account.id);
              const balance = balanceEntry?.balance ?? Number(account.initial_balance);
              const isPositive = balance >= 0;

              return (
                <Card key={account.id} padding={false}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${account.color}15` }}
                        >
                          <Wallet size={16} style={{ color: account.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{account.name}</p>
                          <p className="text-[11px] text-gray-400">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => setEditingAccount(account)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          aria-label="Edit account"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingId(account.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className={cn('text-lg font-bold', isPositive ? 'text-gray-900' : 'text-red-600')}>
                        {formatCurrency(balance, currency)}
                      </p>
                      {isPositive ? (
                        <TrendingUp size={14} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={14} className="text-red-500" />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Account">
        <AccountForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingAccount} onClose={() => setEditingAccount(null)} title="Edit Account">
        {editingAccount && (
          <AccountForm
            initialData={editingAccount}
            onSubmit={handleUpdate}
            onCancel={() => setEditingAccount(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Account" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete this account? Transactions linked to it will become unassigned.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeletingId(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deletingId && handleDelete(deletingId)}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </AnimatedPage>
  );
}
