import ChartCard from '@/components/analytics/ChartCard';
import type { FinancialHealthScore } from '@/types/analytics';

interface FinancialHealthCardProps {
  data: FinancialHealthScore | null;
  loading?: boolean;
}

export default function FinancialHealthCard({ data, loading }: FinancialHealthCardProps) {
  if (!data) return null;

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (data.score / 100) * circumference;

  return (
    <ChartCard title="Financial Health" description="Overall financial wellness score" loading={loading}>
      <div className="flex flex-col items-center gap-4">
        {/* Circular gauge */}
        <div className="relative w-32 h-32" role="img" aria-label={`Financial health score: ${data.score} out of 100, grade ${data.grade}`}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" className="opacity-30" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={data.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{data.score}</span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </div>

        <div className="text-center">
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: data.color }}
          >
            {data.grade} — {data.label}
          </span>
        </div>

        {/* Factors */}
        <div className="w-full space-y-3 mt-2">
          {data.factors.map((factor) => (
            <div key={factor.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{factor.name}</span>
                <span className="text-xs text-gray-500">
                  {factor.score}/{factor.maxScore}
                </span>
              </div>
              <div
                className="w-full bg-gray-100 rounded-full h-1.5"
                role="progressbar"
                aria-valuenow={factor.score}
                aria-valuemin={0}
                aria-valuemax={factor.maxScore}
                aria-label={`${factor.name}: ${factor.score} of ${factor.maxScore}`}
              >
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${(factor.score / factor.maxScore) * 100}%`,
                    backgroundColor: data.color,
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

