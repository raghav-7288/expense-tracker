import { useEffect, useRef } from 'react';
import { useBudgetProgress } from '@/hooks/useBudgets';
import toast from 'react-hot-toast';

/**
 * Fires toast notifications when budget spending crosses thresholds.
 * Mount once at the layout level (DashboardLayout) so alerts trigger
 * when the user logs in or navigates.
 *
 * Uses a ref to track already-alerted budget IDs per session to avoid
 * re-toasting on every re-render or refetch.
 */
export function useBudgetAlerts() {
  const { data: progress } = useBudgetProgress();
  const alertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!progress || progress.length === 0) return;

    for (const item of progress) {
      const key = `${item.budget.id}-${item.status}`;

      // Skip if already alerted for this status in this session
      if (alertedRef.current.has(key)) continue;

      const categoryName = item.budget.category?.name ?? 'Unknown';

      if (item.status === 'exceeded') {
        toast.error(
          `🚨 Over budget on ${categoryName}! (${Math.round(item.percentage)}% spent)`,
          { duration: 5000, id: `budget-exceeded-${item.budget.id}` },
        );
        alertedRef.current.add(key);
      } else if (item.status === 'warning') {
        toast(
          `⚠️ ${categoryName}: ${Math.round(item.percentage)}% of budget used`,
          { duration: 4000, id: `budget-warning-${item.budget.id}` },
        );
        alertedRef.current.add(key);
      }
    }
  }, [progress]);
}

