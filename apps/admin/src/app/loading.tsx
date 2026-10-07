import { LoadingState } from '@/components/common/loading-state';

export default function Loading() {
  return (
    <div className="min-h-screen p-4 md:p-6">
      <LoadingState />
    </div>
  );
}
