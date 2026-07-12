import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-4">
        {variant === 'danger' && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
        )}
        <p className="text-sm text-gray-600 pt-2">{description}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
          className="flex-1"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

