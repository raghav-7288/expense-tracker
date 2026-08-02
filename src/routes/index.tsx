import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import TransactionsLayout from '@/layouts/TransactionsLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignUpPage = lazy(() => import('@/pages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'));
const RecurringPage = lazy(() => import('@/pages/RecurringPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const AccountsPage = lazy(() => import('@/pages/AccountsPage'));
const LoansPage = lazy(() => import('@/pages/LoansPage'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 animate-spin will-change-transform rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Protected app routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            {/* Transactions hub: all / recurring / loans as sub-tabs */}
            <Route path="/transactions" element={<TransactionsLayout />}>
              <Route index element={<TransactionsPage />} />
              <Route path="recurring" element={<RecurringPage />} />
              <Route path="loans" element={<LoansPage />} />
              {/* Unknown sub-path stays inside the hub (falls back to the All tab)
                  instead of bouncing out to /dashboard via the top-level splat. */}
              <Route path="*" element={<Navigate to="/transactions" replace />} />
            </Route>
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Back-compat: old top-level routes now live under /transactions */}
            <Route path="/recurring" element={<Navigate to="/transactions/recurring" replace />} />
            <Route path="/loans" element={<Navigate to="/transactions/loans" replace />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
