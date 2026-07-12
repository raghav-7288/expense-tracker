import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorState from '@/components/ui/ErrorState';

describe('ErrorState', () => {
  it('renders default title and description', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<ErrorState title="Oops" description="Custom error" />);
    expect(screen.getByText('Oops')).toBeInTheDocument();
    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('renders Try Again button when retry provided', () => {
    render(<ErrorState retry={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('does not render button when no retry', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls retry when button is clicked', async () => {
    const retry = vi.fn();
    render(<ErrorState retry={retry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('renders custom icon when provided', () => {
    render(<ErrorState icon={<span data-testid="custom-icon">!</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

