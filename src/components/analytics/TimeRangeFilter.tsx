import { cn } from '@/utils/cn';
import type { TimeRangePreset, DateRange } from '@/types/analytics';
import { Calendar } from 'lucide-react';

interface TimeRangeFilterProps {
  value: TimeRangePreset;
  customRange?: DateRange;
  onChange: (preset: TimeRangePreset, customRange?: DateRange) => void;
}

const PRESETS: { value: TimeRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: '7 Days' },
  { value: 'last30', label: '30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: '3 Months' },
  { value: 'last6Months', label: '6 Months' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

export default function TimeRangeFilter({ value, customRange, onChange }: TimeRangeFilterProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none" role="group" aria-label="Time range">
        <div className="flex gap-1.5 min-w-max sm:min-w-0 sm:flex-wrap">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              aria-pressed={value === preset.value}
              className={cn(
                'px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                value === preset.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      {value === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={14} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
          <input
            type="date"
            aria-label="Start date"
            value={customRange?.startDate ?? ''}
            onChange={(e) =>
              onChange('custom', {
                startDate: e.target.value,
                endDate: customRange?.endDate ?? e.target.value,
              })
            }
            className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs flex-1 min-w-[120px]"
          />
          <span className="text-xs text-gray-400" aria-hidden="true">to</span>
          <input
            type="date"
            aria-label="End date"
            value={customRange?.endDate ?? ''}
            onChange={(e) =>
              onChange('custom', {
                startDate: customRange?.startDate ?? e.target.value,
                endDate: e.target.value,
              })
            }
            className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs flex-1 min-w-[120px]"
          />
        </div>
      )}
    </div>
  );
}

