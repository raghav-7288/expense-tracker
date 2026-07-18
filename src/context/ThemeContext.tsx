import { createContext, useEffect, useState } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('expense-tracker-dark-mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    try {
      localStorage.setItem('expense-tracker-dark-mode', String(darkMode));
    } catch {
      // localStorage unavailable (private browsing, storage quota, etc.)
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}


