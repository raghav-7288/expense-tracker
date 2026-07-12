import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import AuthProvider from '@/context/AuthContext';
import ThemeProvider from '@/context/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppRouter from '@/routes/index';
import { useTheme } from '@/hooks/useTheme';

function AppToaster() {
  const { darkMode } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '8px',
          fontSize: '14px',
          background: darkMode ? '#1e293b' : '#fff',
          color: darkMode ? '#e2e8f0' : '#1e293b',
          border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: darkMode ? '#1e293b' : '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: darkMode ? '#1e293b' : '#fff',
          },
        },
      }}
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
          <AppToaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
