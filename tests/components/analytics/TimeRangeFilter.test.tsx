import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeRangeFilter from '@/components/analytics/TimeRangeFilter';

describe('TimeRangeFilter', () => {
  const onChange = vi.fn();

  it('renders all preset buttons', () => {
    render(<TimeRangeFilter value="last30" onChange={onChange} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Last Month')).toBeInTheDocument();
    expect(screen.getByText('3 Months')).toBeInTheDocument();
    expect(screen.getByText('6 Months')).toBeInTheDocument();
    expect(screen.getByText('This Year')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('highlights active preset', () => {
    render(<TimeRangeFilter value="last30" onChange={onChange} />);
    const activeButton = screen.getByText('30 Days');
    expect(activeButton.className).toContain('bg-primary-600');
  });

  it('calls onChange when preset clicked', () => {
    render(<TimeRangeFilter value="last30" onChange={onChange} />);
    fireEvent.click(screen.getByText('7 Days'));
    expect(onChange).toHaveBeenCalledWith('last7');
  });

  it('shows date inputs when custom is selected', () => {
    render(
      <TimeRangeFilter
        value="custom"
        customRange={{ startDate: '2024-01-01', endDate: '2024-06-30' }}
        onChange={onChange}
      />
    );
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toBeInTheDocument();
  });

  it('calls onChange when custom date changes', () => {
    render(
      <TimeRangeFilter
        value="custom"
        customRange={{ startDate: '2024-01-01', endDate: '2024-06-30' }}
        onChange={onChange}
      />
    );
    const startInput = screen.getByLabelText('Start date');
    fireEvent.change(startInput, { target: { value: '2024-02-01' } });
    expect(onChange).toHaveBeenCalled();
  });
});
