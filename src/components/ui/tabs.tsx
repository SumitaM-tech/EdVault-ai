import * as React from 'react';
import { cn } from '@/lib/utils';

export function Tabs({ children, value, onValueChange, className }: { children: React.ReactNode, value: string, onValueChange: (v: string) => void, className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, activeValue, onValueChange, className }: { children: React.ReactNode, activeValue?: string, onValueChange?: (v: string) => void, className?: string }) {
  return (
    <div className={cn('inline-flex rounded-2xl border border-white/10 bg-white/5 p-1', className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { 
            active: child.props.value === activeValue,
            onClick: () => onValueChange?.(child.props.value)
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ active, className, value, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean, value: string }) {
  return (
    <button
      className={cn(
        'rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300',
        active ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ children, value, activeValue, className }: { children: React.ReactNode, value: string, activeValue?: string, className?: string }) {
  if (value !== activeValue) return null;
  return <div className={cn('animate-fadeInUp', className)}>{children}</div>;
}
