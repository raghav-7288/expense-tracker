import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import AuthProvider from '@/context/AuthContext';
import ThemeProvider from '@/context/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppRouter from '@/routes/index';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '8px',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
