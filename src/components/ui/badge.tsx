import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'outline' | 'secondary' | 'success' | 'destructive';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white border-transparent',
  outline: 'bg-transparent text-slate-300 border-white/10',
  secondary: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  destructive: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2', 
        variants[variant],
        className
      )} 
      {...props} 
    />
  );
}
