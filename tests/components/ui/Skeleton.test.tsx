import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Skeleton, { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders default single pulse element', () => {
    const { container } = render(<Skeleton />);
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThanOrEqual(1);
  });

  it('renders multiple items when count > 1', () => {
    const { container } = render(<Skeleton count={3} />);
    const items = container.querySelectorAll('[aria-hidden="true"]');
    expect(items).toHaveLength(3);
  });

  it('applies circular variant class', () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('applies rectangular variant class', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width={100} height={50} />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el).toHaveStyle({ width: '100px', height: '50px' });
  });
});

describe('SkeletonCard', () => {
  it('renders animated card placeholder', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('SkeletonTable', () => {
  it('renders default 5 rows', () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll('.flex.items-center.gap-3');
    // Subtract 1 for the header row
    expect(rows).toHaveLength(5);
  });

  it('renders custom number of rows', () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const rows = container.querySelectorAll('.flex.items-center.gap-3');
    expect(rows).toHaveLength(3);
  });
});

