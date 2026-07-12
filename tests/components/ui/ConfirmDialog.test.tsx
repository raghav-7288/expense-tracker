import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  const baseProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders with defaults', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<ConfirmDialog {...baseProps} title="Delete?" description="Gone forever" />);
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Gone forever')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', async () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...baseProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows warning icon for danger variant', () => {
    const { container } = render(<ConfirmDialog {...baseProps} variant="danger" />);
    expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
  });

  it('hides warning icon for default variant', () => {
    const { container } = render(<ConfirmDialog {...baseProps} variant="default" />);
    expect(container.querySelector('.bg-red-100')).not.toBeInTheDocument();
  });

  it('disables cancel when loading', () => {
    render(<ConfirmDialog {...baseProps} loading={true} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('uses custom labels', () => {
    render(<ConfirmDialog {...baseProps} confirmLabel="Yes" cancelLabel="No" />);
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });
});

