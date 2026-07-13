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
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              value === preset.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {value === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={14} className="text-gray-400" />
          <input
            type="date"
            value={customRange?.startDate ?? ''}
            onChange={(e) =>
              onChange('custom', {
                startDate: e.target.value,
                endDate: customRange?.endDate ?? e.target.value,
              })
            }
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={customRange?.endDate ?? ''}
            onChange={(e) =>
              onChange('custom', {
                startDate: customRange?.startDate ?? e.target.value,
                endDate: e.target.value,
              })
            }
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs"
          />
        </div>
      )}
    </div>
  );
}

