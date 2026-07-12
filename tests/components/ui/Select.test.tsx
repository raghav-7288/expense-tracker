import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '@/components/ui/Select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

describe('Select', () => {
  it('renders options', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Select label="Type" options={options} />);
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
  });

  it('renders placeholder option', () => {
    render(<Select options={options} placeholder="Select one" />);
    expect(screen.getByText('Select one')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Select options={options} label="Type" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('sets aria-invalid on error', () => {
    render(<Select options={options} label="Type" error="Required" />);
    expect(screen.getByLabelText('Type')).toHaveAttribute('aria-invalid', 'true');
  });

  it('allows selection change', async () => {
    render(<Select options={options} label="Type" />);
    const select = screen.getByLabelText('Type');
    await userEvent.selectOptions(select, 'b');
    expect(select).toHaveValue('b');
  });
});

