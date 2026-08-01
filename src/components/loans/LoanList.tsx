import { useState } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { useDeleteLoan, useRecordRepayment, useUpdateLoan } from '@/hooks/useLoans';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import RepaymentForm from '@/components/loans/RepaymentForm';
import LoanForm from '@/components/loans/LoanForm';
import {
  HandCoins,
  ArrowDownLeft,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  BanknoteArrowDown,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { Loan } from '@/types';

interface LoanListProps {
  loans: Loan[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'settled':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 size={11} /> Settled
        </span>
      );
    case 'partially_paid':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-50 text-amber-700">
          <Clock size={11} /> Partial
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700">
          <AlertCircle size={11} /> Active
        </span>
      );
  }
}

export default function LoanList({ loans }: LoanListProps) {
  const currency = useCurrency();
  const deleteMutation = useDeleteLoan();
  const updateMutation = useUpdateLoan();
  const repaymentMutation = useRecordRepayment();
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  async function handleRepayment(data: { amount: number; date: string; notes?: string; account_id?: string }) {
    if (!repayLoan) return;
    await repaymentMutation.mutateAsync({
      loan_id: repayLoan.id,
      amount: data.amount,
      date: data.date,
      notes: data.notes,
      account_id: data.account_id ?? null,
    });
    setRepayLoan(null);
  }

  async function handleEdit(data: Record<string, unknown>) {
    if (!editLoan) return;
    // Only counterparty_name / due_date / notes are editable — type and
    // principal are locked in the form to keep the disbursement transaction in sync.
    await updateMutation.mutateAsync({
      id: editLoan.id,
      input: {
        counterparty_name: data.counterparty_name as string,
        due_date: (data.due_date as string) || null,
        notes: (data.notes as string) || null,
      },
    });
    setEditLoan(null);
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this loan and all linked transactions?')) {
      deleteMutation.mutate(id);
    }
    setMenuOpen(null);
  }

  return (
    <>
      <div className="space-y-3">
        {loans.map((loan) => {
          const isLent = loan.type === 'lent';
          const progress = loan.principal_amount > 0
            ? ((loan.principal_amount - loan.outstanding_amount) / loan.principal_amount) * 100
            : 0;
          const isOverdue = loan.due_date && loan.status !== 'settled' && new Date(loan.due_date) < new Date();

          return (
            <Card key={loan.id} padding={false}>
              <div className="p-4 sm:p-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        isLent ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600',
                      )}
                    >
                      {isLent ? <HandCoins size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {loan.counterparty_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isLent ? 'You lent' : 'You borrowed'} {formatCurrency(loan.principal_amount, currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(loan.status)}
                    {/* Actions menu */}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === loan.id ? null : loan.id)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
                        aria-label="Loan actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen === loan.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                          {loan.status !== 'settled' && (
                            <button
                              onClick={() => { setRepayLoan(loan); setMenuOpen(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <BanknoteArrowDown size={14} />
                              Record Repayment
                            </button>
                          )}
                          <button
                            onClick={() => { setEditLoan(loan); setMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(loan.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {loan.status !== 'settled' && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        Outstanding: <span className="font-semibold text-gray-700">{formatCurrency(loan.outstanding_amount, currency)}</span>
                      </span>
                      <span className="text-gray-400">{Math.round(progress)}% repaid</span>
                    </div>
                    <div className="loan-track h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'loan-track-fill h-full rounded-full transition-all duration-500',
                          isLent ? 'loan-track-fill--lent' : 'loan-track-fill--borrowed',
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Bottom info row */}
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  {loan.due_date && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[11px]',
                        isOverdue ? 'text-red-600 font-medium' : 'text-gray-400',
                      )}
                    >
                      <Calendar size={11} />
                      {isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(loan.due_date)}
                    </span>
                  )}
                  {loan.notes && (
                    <span className="text-[11px] text-gray-400 truncate">
                      {loan.notes}
                    </span>
                  )}
                </div>

                {/* Quick repay button for active loans */}
                {loan.status !== 'settled' && (
                  <button
                    onClick={() => setRepayLoan(loan)}
                    className={cn(
                      'mt-3 w-full py-2 rounded-lg text-xs font-medium transition-all border',
                      isLent
                        ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                        : 'border-amber-200 text-amber-700 hover:bg-amber-50',
                    )}
                  >
                    <BanknoteArrowDown size={13} className="inline mr-1.5" />
                    Record Repayment
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Repayment Modal */}
      <Modal
        open={!!repayLoan}
        onClose={() => setRepayLoan(null)}
        title="Record Repayment"
      >
        {repayLoan && (
          <RepaymentForm
            loan={repayLoan}
            onSubmit={handleRepayment}
            onCancel={() => setRepayLoan(null)}
            loading={repaymentMutation.isPending}
          />
        )}
      </Modal>

      {/* Edit Loan Modal */}
      <Modal
        open={!!editLoan}
        onClose={() => setEditLoan(null)}
        title="Edit Loan"
      >
        {editLoan && (
          <LoanForm
            initialData={editLoan}
            onSubmit={handleEdit}
            onCancel={() => setEditLoan(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </>
  );
}

