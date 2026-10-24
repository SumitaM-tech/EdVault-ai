import { cn } from '@/lib/utils';

export function BarChart({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className={cn('flex h-40 items-end gap-2', className)}>
      {values.map((value, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-400/60 to-cyan-300/80" style={{ height: `${(value / max) * 100}%` }} />
          <span className="text-[10px] text-slate-500">{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${100 - (value / max) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-full">
      <polyline fill="none" stroke="rgba(52, 211, 153, 0.9)" strokeWidth="2.5" points={points} />
    </svg>
  );
}
