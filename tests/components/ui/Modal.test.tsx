import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders nothing when open=false', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()} title="Test">Content</Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders content when open=true', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Test Title">Modal body</Modal>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('has dialog role with aria-modal', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Test">Content</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test">Content</Modal>);
    await userEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test">Content</Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test">Content</Modal>);
    // The backdrop is the absolute div behind the content
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.querySelector('.absolute');
    if (backdrop) await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('applies sm size class', () => {
    render(<Modal open={true} onClose={vi.fn()} title="T" size="sm">C</Modal>);
    const dialog = screen.getByRole('dialog');
    const content = dialog.querySelector('[tabindex="-1"]');
    expect(content?.className).toContain('max-w-sm');
  });

  it('applies lg size class', () => {
    render(<Modal open={true} onClose={vi.fn()} title="T" size="lg">C</Modal>);
    const dialog = screen.getByRole('dialog');
    const content = dialog.querySelector('[tabindex="-1"]');
    expect(content?.className).toContain('max-w-lg');
  });
});

