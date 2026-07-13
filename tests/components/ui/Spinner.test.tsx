import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Spinner from '@/components/ui/Spinner';

describe('Spinner', () => {
  it('renders a spinning element', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('uses default size of 20', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('uses custom size', () => {
    const { container } = render(<Spinner size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="text-red-500" />);
    const svg = container.querySelector('svg');
    expect(svg?.className.baseVal || svg?.getAttribute('class')).toContain('text-red-500');
  });
});

