import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import Spinner from '@/components/ui/Spinner';
import { Wallet, Sun, Moon } from 'lucide-react';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const { darkMode, setDarkMode } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gray-50">
      <main className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          <Wallet className="text-primary-600" size={24} aria-hidden="true" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 nav-brand">ExpenseTracker</h1>
          <button
            type="button"
            className="nav-theme-toggle ml-2"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
