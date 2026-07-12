import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ThemeContext } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/useTheme';
import type { ReactNode } from 'react';

describe('useTheme', () => {
  it('throws when used outside ThemeProvider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
  });

  it('returns darkMode and setDarkMode from context', () => {
    const setDarkMode = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeContext.Provider value={{ darkMode: false, setDarkMode }}>
        {children}
      </ThemeContext.Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.darkMode).toBe(false);
    expect(result.current.setDarkMode).toBe(setDarkMode);
  });
});

