import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeRangeFilter from '@/components/analytics/TimeRangeFilter';

describe('TimeRangeFilter', () => {
  const onChange = vi.fn();

  it('renders all preset buttons', () => {
    render(<TimeRangeFilter value="last30" onChange={onChange} />);
    expect(screen.getByText('All Time')).toBeInTheDocument();
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

  it('renders "All Time" as the first filter button', () => {
    render(<TimeRangeFilter value="thisMonth" onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Time range' });
    const buttons = group.querySelectorAll('button');
    expect(buttons[0]).toHaveTextContent('All Time');
  });

  it('calls onChange with "allTime" when All Time clicked', () => {
    render(<TimeRangeFilter value="thisMonth" onChange={onChange} />);
    fireEvent.click(screen.getByText('All Time'));
    expect(onChange).toHaveBeenCalledWith('allTime');
  });

  it('highlights All Time when active and matches shared button styling', () => {
    render(<TimeRangeFilter value="allTime" onChange={onChange} />);
    const allTimeButton = screen.getByText('All Time');
    // Active styling (identical to every other active preset button)
    expect(allTimeButton.className).toContain('bg-primary-600');
    expect(allTimeButton.className).toContain('text-white');
    expect(allTimeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('All Time uses the same inactive styling as other presets', () => {
    render(<TimeRangeFilter value="thisMonth" onChange={onChange} />);
    const allTimeButton = screen.getByText('All Time');
    const otherButton = screen.getByText('This Year');
    // Inactive buttons share the exact same class list
    expect(allTimeButton.className).toBe(otherButton.className);
    expect(allTimeButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not show custom date inputs when All Time is selected', () => {
    render(<TimeRangeFilter value="allTime" onChange={onChange} />);
    expect(screen.queryByLabelText('Start date')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('End date')).not.toBeInTheDocument();
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
