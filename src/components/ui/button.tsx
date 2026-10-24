import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'success' | 'neon' | 'neon-pink';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

const styles: Record<Variant, string> = {
  default: 'bg-cyan-500 text-slate-950 hover:bg-cyan-600 font-semibold shadow-lg shadow-cyan-500/50 transition-all hover:shadow-cyan-500/70',
  secondary: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/50 font-medium',
  outline: 'border border-cyan-500/30 bg-transparent hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white',
  success: 'bg-neon-green text-slate-950 hover:bg-neon-green/90 font-semibold shadow-lg shadow-green-500/50',
  neon: 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-500/70 hover:shadow-lg hover:shadow-cyan-500/30',
  'neon-pink': 'bg-pink-500/20 border border-pink-500/50 text-pink-300 hover:bg-pink-500/30 hover:border-pink-500/70 hover:shadow-lg hover:shadow-pink-500/30',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  default: 'h-11 px-4',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 shrink-0',
        styles[variant],
        sizes[size as keyof typeof sizes],
        className,
      )}
      {...props}
    />
  );
}
