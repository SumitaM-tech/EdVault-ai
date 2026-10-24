import * as React from 'react';
import { cn } from '@/lib/utils';

export function Switch({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full border transition',
        checked ? 'border-emerald-400/50 bg-emerald-400/30' : 'border-white/10 bg-white/5',
      )}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white transition', checked ? 'translate-x-5' : 'translate-x-1')} />
    </button>
  );
}
