import { Lightbulb, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import ChartCard from '@/components/analytics/ChartCard';
import type { InsightItem } from '@/types/analytics';
import type { ReactNode } from 'react';

interface SmartInsightsProps {
  data: InsightItem[];
  loading?: boolean;
}

const ICON_MAP: Record<InsightItem['type'], ReactNode> = {
  info: <Info size={14} />,
  warning: <AlertTriangle size={14} />,
  success: <TrendingUp size={14} />,
  tip: <Lightbulb size={14} />,
};

const STYLE_MAP: Record<InsightItem['type'], string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  tip: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function SmartInsights({ data, loading }: SmartInsightsProps) {
  return (
    <ChartCard
      title="Smart Insights"
      description="AI-powered observations about your finances"
      loading={loading}
      empty={data.length === 0}
      emptyMessage="Add more transactions to generate insights"
    >
      <div className="space-y-2">
        {data.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              'flex items-start gap-2.5 p-3 rounded-lg border text-xs',
              STYLE_MAP[insight.type],
            )}
          >
            <div className="flex-shrink-0 mt-0.5">{ICON_MAP[insight.type]}</div>
            <div>
              <p className="font-medium">{insight.message}</p>
              {insight.detail && (
                <p className="mt-0.5 opacity-75">{insight.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}


