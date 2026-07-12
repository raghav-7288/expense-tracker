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

