import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown';

describe('Dropdown', () => {
  it('renders trigger but not content initially', () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows content when trigger clicked', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('hides content when trigger clicked again', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByText('Open'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('applies left alignment', async () => {
    render(
      <Dropdown trigger={<button>Open</button>} align="left">
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('menu').className).toContain('left-0');
  });

  it('closes on click outside', async () => {
    render(
      <div>
        <Dropdown trigger={<button>Open</button>}>
          <DropdownItem>Item 1</DropdownItem>
        </Dropdown>
        <button>Outside</button>
      </div>
    );
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('navigates with ArrowDown key', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item A</DropdownItem>
        <DropdownItem>Item B</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    // First item should be focused
    const items = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(items[0]);
    // Press ArrowDown to move to next item
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[1]);
  });

  it('navigates with ArrowUp key', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item A</DropdownItem>
        <DropdownItem>Item B</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    const items = screen.getAllByRole('menuitem');
    // Move down first, then up
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[1]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(items[0]);
  });

  it('navigates with Home and End keys', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item A</DropdownItem>
        <DropdownItem>Item B</DropdownItem>
        <DropdownItem>Item C</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    const items = screen.getAllByRole('menuitem');
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(items[2]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(items[0]);
  });

  it('wraps around with ArrowDown on last item', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Item A</DropdownItem>
        <DropdownItem>Item B</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    const items = screen.getAllByRole('menuitem');
    await userEvent.keyboard('{ArrowDown}'); // to Item B
    await userEvent.keyboard('{ArrowDown}'); // wrap to Item A
    expect(document.activeElement).toBe(items[0]);
  });

  it('passes label to aria attributes', async () => {
    render(
      <Dropdown trigger={<button>Open</button>} label="Actions menu">
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    const trigger = screen.getByLabelText('Actions menu');
    expect(trigger).toBeInTheDocument();
    await userEvent.click(trigger);
    expect(screen.getByRole('menu')).toHaveAttribute('aria-label', 'Actions menu');
  });
});

describe('DropdownItem', () => {
  it('renders children', () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem>Action</DropdownItem>
      </Dropdown>
    );
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem onClick={onClick}>Action</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Action' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies danger variant class', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem variant="danger">Delete</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('menuitem', { name: 'Delete' }).className).toContain('text-red-600');
  });

  it('is disabled when disabled prop set', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem disabled>Disabled</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('menuitem', { name: 'Disabled' })).toBeDisabled();
  });

  it('renders icon', async () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <DropdownItem icon={<span data-testid="icon">X</span>}>With Icon</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});

