import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loader icon when loading', () => {
    const { container } = render(<Button loading>Click</Button>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('applies primary variant classes by default', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button').className).toContain('bg-primary-600');
  });

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Click</Button>);
    expect(screen.getByRole('button').className).toContain('bg-white');
  });

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Click</Button>);
    expect(screen.getByRole('button').className).toContain('bg-red-600');
  });

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Click</Button>);
    expect(screen.getByRole('button').className).toContain('bg-transparent');
  });

  it('applies sm size classes', () => {
    render(<Button size="sm">Click</Button>);
    expect(screen.getByRole('button').className).toContain('px-3');
    expect(screen.getByRole('button').className).toContain('py-1.5');
  });

  it('applies lg size classes', () => {
    render(<Button size="lg">Click</Button>);
    expect(screen.getByRole('button').className).toContain('px-5');
  });

  it('merges custom className', () => {
    render(<Button className="w-full">Click</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  // Loading spinner stability tests
  describe('loading spinner stability', () => {
    it('children stay in DOM during loading (invisible but present for sizing)', () => {
      const { container } = render(<Button loading>Add Transaction</Button>);
      // Children text is still in the DOM (holds width)
      expect(screen.getByRole('button')).toHaveTextContent('Add Transaction');
      // But the content wrapper is invisible
      const contentSpan = container.querySelector('button > span:first-child');
      expect(contentSpan?.className).toContain('invisible');
    });

    it('spinner is absolutely positioned (no layout shift)', () => {
      const { container } = render(<Button loading>Submit</Button>);
      const spinnerWrapper = container.querySelector('button > span:last-child');
      expect(spinnerWrapper?.className).toContain('absolute');
      expect(spinnerWrapper?.className).toContain('inset-0');
    });

    it('children are visible when not loading', () => {
      const { container } = render(<Button>Submit</Button>);
      const contentSpan = container.querySelector('button > span:first-child');
      expect(contentSpan?.className).not.toContain('invisible');
    });

    it('button has relative positioning for spinner overlay', () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole('button').className).toContain('relative');
    });

    it('re-render from loading to not-loading removes spinner', () => {
      const { container, rerender } = render(<Button loading>Save</Button>);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      rerender(<Button>Save</Button>);
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
      expect(container.querySelector('.invisible')).not.toBeInTheDocument();
    });

    it('re-render from not-loading to loading keeps text for sizing', () => {
      const { container, rerender } = render(<Button>Save Changes</Button>);
      expect(container.querySelector('.invisible')).not.toBeInTheDocument();
      rerender(<Button loading>Save Changes</Button>);
      // Text stays in DOM but is invisible
      expect(screen.getByRole('button')).toHaveTextContent('Save Changes');
      expect(container.querySelector('.invisible')).toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});

