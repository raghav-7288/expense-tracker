import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  LayoutDashboard,
  BarChart3,
  ArrowLeftRight,
  Tag,
  User,
  LogOut,
  Menu,
  X,
  Wallet,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/transactions': 'Transactions',
  '/categories': 'Categories',
  '/profile': 'Profile',
};

export default function DashboardLayout() {
  const { signOut, user } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const currentTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard';
  const userInitial = (user?.user_metadata?.full_name ?? user?.email ?? 'U').charAt(0).toUpperCase();
  const userName = user?.user_metadata?.full_name ?? user?.email ?? '';

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark-layout">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-gray-200/80 flex flex-col transition-transform duration-250 ease-out lg:translate-x-0 lg:static lg:z-auto nav-sidebar',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-gray-100 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <Wallet className="text-white" size={15} />
          </div>
          <span className="text-sm font-bold text-gray-900 nav-brand">ExpenseTracker</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-400"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'nav-link group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative',
                  isActive
                    ? 'nav-link-active bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary-600 rounded-r-full" />
                  )}
                  <item.icon size={17} className={cn('flex-shrink-0', isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600')} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="text-primary-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 flex-shrink-0 space-y-1">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="nav-link flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} className="text-gray-400" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="nav-link flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={17} className="text-gray-400" aria-hidden="true" />
            <span>Sign Out</span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1 border-t border-gray-100 pt-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white">{userInitial}</span>
            </div>
            <span className="text-xs text-gray-500 truncate flex-1">{userName}</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (desktop: breadcrumb, mobile: hamburger + logo) */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/60 nav-sidebar">
          <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 h-14">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden text-gray-500"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden flex-1">
              <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center">
                <Wallet className="text-white" size={12} />
              </div>
              <span className="text-sm font-bold text-gray-900 nav-brand">ExpenseTracker</span>
            </div>

            {/* Desktop breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 flex-1">
              <span className="text-sm font-medium text-gray-900">{currentTitle}</span>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
