import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartCard from '@/components/analytics/ChartCard';

describe('ChartCard', () => {
  it('renders title and children', () => {
    render(<ChartCard title="Monthly Income">Chart content</ChartCard>);
    expect(screen.getByText('Monthly Income')).toBeInTheDocument();
    expect(screen.getByText('Chart content')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<ChartCard title="Title" description="Some info">Content</ChartCard>);
    expect(screen.getByText('Some info')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(<ChartCard title="Title" action={<button>Export</button>}>Content</ChartCard>);
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('shows loading skeleton when loading=true', () => {
    const { container } = render(<ChartCard title="Title" loading>Content</ChartCard>);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows empty state when empty=true', () => {
    render(<ChartCard title="Title" empty emptyMessage="No data here">Content</ChartCard>);
    expect(screen.getByText('No data here')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows custom empty icon', () => {
    render(<ChartCard title="Title" empty emptyIcon={<span data-testid="custom-icon" />}>Content</ChartCard>);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('shows empty action when provided', () => {
    render(
      <ChartCard title="Title" empty emptyAction={<button>Add data</button>}>
        Content
      </ChartCard>,
    );
    expect(screen.getByRole('button', { name: 'Add data' })).toBeInTheDocument();
  });
});

