import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextArea from '@/components/ui/TextArea';

describe('TextArea', () => {
  it('renders without label', () => {
    render(<TextArea placeholder="Notes" />);
    expect(screen.getByPlaceholderText('Notes')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<TextArea label="Notes" />);
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('generates id from label', () => {
    render(<TextArea label="Extra Notes" />);
    expect(screen.getByLabelText('Extra Notes')).toHaveAttribute('id', 'extra-notes');
  });

  it('shows error message', () => {
    render(<TextArea label="Notes" error="Too long" />);
    expect(screen.getByText('Too long')).toBeInTheDocument();
  });

  it('applies error class when error present', () => {
    render(<TextArea label="Notes" error="Error" />);
    expect(screen.getByLabelText('Notes').className).toContain('border-red-300');
  });

  it('accepts user input', async () => {
    render(<TextArea label="Notes" />);
    const textarea = screen.getByLabelText('Notes');
    await userEvent.type(textarea, 'hello world');
    expect(textarea).toHaveValue('hello world');
  });

  it('has 3 rows by default', () => {
    render(<TextArea label="Notes" />);
    expect(screen.getByLabelText('Notes')).toHaveAttribute('rows', '3');
  });
});

