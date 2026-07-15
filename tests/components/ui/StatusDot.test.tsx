import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StatusDot from '@/components/ui/StatusDot';

describe('StatusDot', () => {
  it('renders with default size (sm)', () => {
    const { container } = render(<StatusDot color="#ef4444" />);
    const dot = container.firstChild as HTMLElement;
    expect(dot).toHaveStyle({ backgroundColor: '#ef4444' });
    expect(dot.className).toContain('w-2');
  });

  it('renders with md size', () => {
    const { container } = render(<StatusDot color="#3b82f6" size="md" />);
    const dot = container.firstChild as HTMLElement;
    expect(dot.className).toContain('w-2.5');
  });

  it('renders with lg size', () => {
    const { container } = render(<StatusDot color="#10b981" size="lg" />);
    const dot = container.firstChild as HTMLElement;
    expect(dot.className).toContain('w-3');
  });

  it('applies custom className', () => {
    const { container } = render(<StatusDot color="#000" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
