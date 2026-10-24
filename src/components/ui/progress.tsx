import * as React from 'react';
import { cn } from '@/lib/utils';

export function Progress({ value = 0, className, indicatorClassName }: { value?: number; className?: string; indicatorClassName?: string }) {
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-white/5', className)}>
      <div
        className={cn('h-full w-full flex-1 bg-cyan-500 transition-all duration-500', indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}
