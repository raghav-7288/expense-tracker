import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccounts } from '@/hooks/useAccounts';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils/cn';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { getToday } from '@/utils/formatDate';
import {
  UserRound,
  FileText,
  Calendar,
  IndianRupee,
  DollarSign,
  Euro,
  PoundSterling,
  JapaneseYen,
} from 'lucide-react';
import type { Loan, LoanType } from '@/types';

const loanSchema = z.object({
  type: z.enum(['lent', 'borrowed']),
  counterparty_name: z.string().min(1, 'Name is required').max(100),
  principal_amount: z.coerce.number().positive('Amount must be greater than 0'),
  account_id: z.string().optional().transform((v) => v || undefined),
  due_date: z.string().optional().transform((v) => v || undefined),
  notes: z.string().max(500).optional().transform((v) => v || undefined),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface LoanFormProps {
  initialData?: Loan;
  onSubmit: (data: LoanFormData) => Promise<void>;
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

export default function LoanForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: LoanFormProps) {
  const currency = useCurrency();
  const { data: accounts } = useAccounts();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema) as never,
    defaultValues: {
      type: (initialData?.type as LoanType) ?? 'lent',
      counterparty_name: initialData?.counterparty_name ?? '',
      principal_amount: initialData ? Number(initialData.principal_amount) : undefined,
      account_id: '',
      due_date: initialData?.due_date ?? '',
      notes: initialData?.notes ?? '',
    },
  });

  const selectedType = useWatch({ control, name: 'type' });

  // In edit mode we lock the loan `type` and `principal_amount`: both are baked
  // into the disbursement transaction created when the loan was recorded, so
  // changing them would desync that transaction. `UpdateLoanInput` only allows
  // counterparty_name / due_date / notes, so those are the editable fields.
  const isEdit = !!initialData;

  const accountOptions = (accounts ?? []).map((a) => ({
    value: a.id,
    label: a.name,
  }));

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4 sm:space-y-5">
      {/* Type toggle */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Loan type</legend>
        <div
          className={cn(
            'txn-type-group grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-gray-100',
            isEdit && 'pointer-events-none opacity-60',
          )}
          aria-disabled={isEdit || undefined}
        >
          <label className="relative cursor-pointer touch-manipulation">
            <input type="radio" value="lent" {...register('type')} tabIndex={isEdit ? -1 : undefined} className="peer sr-only" />
            <div className="txn-type-option txn-type-expense rounded-lg py-3 sm:py-2.5 text-center text-sm font-bold transition-all peer-checked:bg-rose-500 peer-checked:text-white peer-checked:shadow-md peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500/40">
              I Lent
            </div>
          </label>
          <label className="relative cursor-pointer touch-manipulation">
            <input type="radio" value="borrowed" {...register('type')} tabIndex={isEdit ? -1 : undefined} className="peer sr-only" />
            <div className="txn-type-option txn-type-income rounded-lg py-3 sm:py-2.5 text-center text-sm font-bold transition-all peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:shadow-md peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40">
              I Borrowed
            </div>
          </label>
        </div>
        {isEdit && (
          <p className="mt-1.5 text-[11px] text-gray-400">Loan type can't be changed after a loan is created.</p>
        )}
      </fieldset>

      <Input
        label={selectedType === 'lent' ? 'Lent to (Person name)' : 'Borrowed from (Person name)'}
        placeholder={selectedType === 'lent' ? 'e.g. Rahul' : 'e.g. Priya'}
        leftIcon={<UserRound size={15} />}
        error={errors.counterparty_name?.message}
        {...register('counterparty_name')}
      />

      <Input
        label="Amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        leftIcon={getCurrencyIcon(currency)}
        readOnly={isEdit}
        className={isEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : undefined}
        helperText={isEdit ? "Amount can't be changed after a loan is created." : undefined}
        error={errors.principal_amount?.message}
        {...register('principal_amount')}
      />

      {!isEdit && accountOptions.length > 0 && (
        <Select
          label="Account"
          options={accountOptions}
          placeholder="No account (general)"
          error={errors.account_id?.message}
          {...register('account_id')}
        />
      )}

      <Input
        label="Due date (optional)"
        type="date"
        leftIcon={<Calendar size={15} />}
        min={isEdit ? undefined : getToday()}
        error={errors.due_date?.message}
        {...register('due_date')}
      />

      <Input
        label="Notes (optional)"
        placeholder="e.g. For rent deposit"
        leftIcon={<FileText size={15} />}
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex gap-3 pt-4 sm:pt-3 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 touch-manipulation">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1 touch-manipulation">
          {initialData ? 'Save Changes' : 'Record Loan'}
        </Button>
      </div>
    </form>
  );
}

