import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 size={size} className={cn('animate-spin text-gray-400', className)} />
    </div>
  );
}
