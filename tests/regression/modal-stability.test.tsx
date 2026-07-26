/**
 * Regression tests for Modal component — ensures the escape handler
 * doesn't cause unnecessary re-renders when onClose reference changes.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Modal from '@/components/ui/Modal';

afterEach(cleanup);

describe('Modal Regression', () => {
  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal is closed', () => {
    const onClose = vi.fn();
    render(
      <Modal open={false} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('uses the latest onClose callback even when reference changes', () => {
    const firstOnClose = vi.fn();
    const secondOnClose = vi.fn();

    const { rerender } = render(
      <Modal open={true} onClose={firstOnClose} title="Test">
        <p>Content</p>
      </Modal>,
    );

    // Re-render with a new onClose reference
    rerender(
      <Modal open={true} onClose={secondOnClose} title="Test">
        <p>Content</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    // Should call the latest callback, not the stale one
    expect(secondOnClose).toHaveBeenCalledTimes(1);
    expect(firstOnClose).not.toHaveBeenCalled();
  });

  it('locks body scroll when open and restores on close', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>,
    );

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal open={false} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>,
    );

    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('renders title and content when open', () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="My Title">
        <p>Hello World</p>
      </Modal>,
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="My Title">
        <p>Hello World</p>
      </Modal>,
    );
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
  });
});

