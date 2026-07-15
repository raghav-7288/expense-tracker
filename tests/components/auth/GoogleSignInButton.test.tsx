import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

describe('GoogleSignInButton', () => {
  it('renders button text', () => {
    render(<GoogleSignInButton onClick={vi.fn().mockResolvedValue({ error: null })} />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('shows loading spinner when clicked', async () => {
    let resolveClick: (v: { error: null }) => void;
    const onClick = vi.fn().mockReturnValue(new Promise((r) => { resolveClick = r; }));

    const { container } = render(<GoogleSignInButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
    expect(screen.getByRole('button')).toBeDisabled();

    resolveClick!({ error: null });
  });

  it('shows error from onClick result', async () => {
    const onClick = vi.fn().mockResolvedValue({ error: new Error('Auth failed') });

    render(<GoogleSignInButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Auth failed')).toBeInTheDocument();
    });
  });

  it('shows generic error on exception', async () => {
    const onClick = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<GoogleSignInButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('prevents double-click while loading', async () => {
    const onClick = vi.fn().mockReturnValue(new Promise(() => {}));

    render(<GoogleSignInButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

