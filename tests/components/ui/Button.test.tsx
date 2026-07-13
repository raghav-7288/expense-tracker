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
});

