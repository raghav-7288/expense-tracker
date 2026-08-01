import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccounts } from '@/hooks/useAccounts';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { getToday } from '@/utils/formatDate';
import {
  FileText,
  Calendar,
  IndianRupee,
  DollarSign,
  Euro,
  PoundSterling,
  JapaneseYen,
} from 'lucide-react';
import type { Loan } from '@/types';

interface RepaymentFormProps {
  loan: Loan;
  onSubmit: (data: { amount: number; date: string; notes?: string; account_id?: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function getCurrencyIcon(currency: string) {
  switch (currency) {
    case 'INR': return <IndianRupee size={15} />;
    case 'EUR': return <Euro size={15} />;
    case 'GBP': return <PoundSterling size={15} />;
    case 'JPY': return <JapaneseYen size={15} />;
    default: return <DollarSign size={15} />;
  }
}

export default function RepaymentForm({ loan, onSubmit, onCancel, loading = false }: RepaymentFormProps) {
  const currency = useCurrency();
  const { data: accounts } = useAccounts();

  const repaymentSchema = z.object({
    amount: z.coerce
      .number()
      .positive('Amount must be greater than 0')
      .max(loan.outstanding_amount, `Cannot exceed outstanding amount (${formatCurrency(loan.outstanding_amount, currency)})`),
    date: z.string().min(1, 'Date is required'),
    notes: z.string().max(500).optional().transform((v) => v || undefined),
    account_id: z.string().optional().transform((v) => v || undefined),
  });

  type RepaymentFormData = z.infer<typeof repaymentSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RepaymentFormData>({
    resolver: zodResolver(repaymentSchema) as never,
    defaultValues: {
      amount: undefined,
      date: getToday(),
      notes: '',
      account_id: '',
    },
  });

  const accountOptions = (accounts ?? []).map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const isLent = loan.type === 'lent';

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4 sm:space-y-5">
      {/* Loan info summary */}
      <div className="rounded-lg bg-gray-50 p-3 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{isLent ? 'Lent to' : 'Borrowed from'}</span>
          <span className="font-medium text-gray-900">{loan.counterparty_name}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Outstanding</span>
          <span className="font-semibold text-gray-900">{formatCurrency(loan.outstanding_amount, currency)}</span>
        </div>
      </div>

      <Input
        label="Repayment amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        leftIcon={getCurrencyIcon(currency)}
        error={errors.amount?.message}
        {...register('amount')}
      />

      {/* Quick fill button */}
      <button
        type="button"
        onClick={() => setValue('amount', loan.outstanding_amount)}
        className="text-xs text-primary-600 hover:text-primary-700 font-medium -mt-2"
      >
        Fill full amount ({formatCurrency(loan.outstanding_amount, currency)})
      </button>

      <Input
        label="Date"
        type="date"
        leftIcon={<Calendar size={15} />}
        error={errors.date?.message}
        {...register('date')}
      />

      {accountOptions.length > 0 && (
        <Select
          label="Account"
          options={accountOptions}
          placeholder="No account (general)"
          error={errors.account_id?.message}
          {...register('account_id')}
        />
      )}

      <Input
        label="Notes (optional)"
        placeholder={isLent ? `Repayment from ${loan.counterparty_name}` : `Repaid to ${loan.counterparty_name}`}
        leftIcon={<FileText size={15} />}
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex gap-3 pt-4 sm:pt-3 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 touch-manipulation">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1 touch-manipulation">
          Record Repayment
        </Button>
      </div>
    </form>
  );
}

