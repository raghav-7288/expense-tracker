import { NavLink, Outlet } from 'react-router-dom';
import { Receipt, Repeat, HandCoins } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Groups the transaction-related views (all transactions, recurring rules,
 * loans) under a single "/transactions" hub with a secondary tab bar, so they
 * no longer need their own top-level sidebar entries.
 */
const tabs = [
  { to: '/transactions', label: 'All', icon: Receipt, end: true },
  { to: '/transactions/recurring', label: 'Recurring', icon: Repeat, end: false },
  { to: '/transactions/loans', label: 'Loans', icon: HandCoins, end: false },
];

export default function TransactionsLayout() {
  return (
    <div className="space-y-5">
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto" aria-label="Transaction views">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap touch-manipulation',
                  isActive
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
                )
              }
            >
              <tab.icon size={15} className="flex-shrink-0" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}

