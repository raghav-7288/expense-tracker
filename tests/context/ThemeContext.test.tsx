import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeProvider from '@/context/ThemeContext';
import { useTheme } from '@/hooks/useTheme';

function TestConsumer() {
  const { darkMode, setDarkMode } = useTheme();
  return (
    <div>
      <span data-testid="mode">{darkMode ? 'dark' : 'light'}</span>
      <button onClick={() => setDarkMode(!darkMode)}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
  });

  it('defaults to light mode', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('light');
  });

  it('reads initial state from localStorage', () => {
    localStorage.setItem('expense-tracker-dark-mode', 'true');
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
  });

  it('toggles dark mode and persists to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(localStorage.getItem('expense-tracker-dark-mode')).toBe('true');
  });

  it('adds dark-mode class to body', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });
});

