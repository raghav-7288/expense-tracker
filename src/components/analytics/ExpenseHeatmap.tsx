import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCurrency } from '@/utils/formatCurrency';
import type { HeatmapDay } from '@/types/analytics';

interface ExpenseHeatmapProps {
  data: HeatmapDay[];
  loading?: boolean;
  currency: string;
}

const LIGHT_COLORS = ['#ebedf0', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'];
const DARK_COLORS = ['#1e293b', '#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Mon', 'Wed', 'Fri'];

export default function ExpenseHeatmap({ data, loading, currency }: ExpenseHeatmapProps) {
  const { darkMode } = useTheme();
  const colors = darkMode ? DARK_COLORS : LIGHT_COLORS;

  // Organize data into weeks (columns) and days (rows, 0=Sun..6=Sat)
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  if (data.length > 0) {
    // Pad the first week
    const firstDayOfWeek = new Date(data[0]!.date + 'T00:00:00').getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', amount: 0, count: 0, level: 0 });
    }

    for (const day of data) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', amount: 0, count: 0, level: 0 });
      }
      weeks.push(currentWeek);
    }
  }

  // Determine month label positions
  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const firstDay = weeks[w]?.find((d) => d.date !== '');
    if (firstDay) {
      const month = new Date(firstDay.date + 'T00:00:00').getMonth();
      if (month !== lastMonth) {
        monthPositions.push({ label: MONTH_LABELS[month] ?? '', col: w });
        lastMonth = month;
      }
    }
  }

  return (
    <ChartCard title="Expense Heatmap" description="365-day activity overview" loading={loading} empty={data.length === 0}>
      <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="flex ml-8 mb-1">
          {monthPositions.map((mp) => (
            <span
              key={`${mp.label}-${mp.col}`}
              className="text-[10px] text-gray-400"
              style={{ position: 'relative', left: `${mp.col * 13}px` }}
            >
              {mp.label}
            </span>
          ))}
        </div>

        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 pr-1">
            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
              <div key={dayIdx} className="w-6 h-[11px] flex items-center justify-end">
                <span className="text-[9px] text-gray-400">
                  {DAY_LABELS.includes(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIdx] ?? '')
                    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIdx]
                    : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={cn(
                    'w-[11px] h-[11px] rounded-sm transition-colors',
                    day.date === '' && 'invisible',
                  )}
                  style={{ backgroundColor: colors[day.level] }}
                  title={
                    day.date
                      ? `${day.date}: ${formatCurrency(day.amount, currency)} (${day.count} txn)`
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-3 justify-end">
          <span className="text-[10px] text-gray-400 mr-1">Less</span>
          {colors.map((color, i) => (
            <div key={i} className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: color }} />
          ))}
          <span className="text-[10px] text-gray-400 ml-1">More</span>
        </div>
      </div>
    </ChartCard>
  );
}

