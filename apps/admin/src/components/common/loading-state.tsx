import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

export type LoadingStateProps = {
  className?: string;
  rows?: number;
};

export function LoadingState({ className, rows = 5 }: LoadingStateProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="rounded-lg border">
        <div className="space-y-0">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b p-4 last:border-0"
            >
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
