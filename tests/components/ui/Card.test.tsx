import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies padding by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('removes padding when padding=false', () => {
    const { container } = render(<Card padding={false}>Content</Card>);
    expect(container.firstChild).not.toHaveClass('p-6');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="mt-4">Content</Card>);
    expect(container.firstChild).toHaveClass('mt-4');
  });

  it('always has rounded-xl and border', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass('rounded-xl');
    expect(container.firstChild).toHaveClass('border');
  });
});

