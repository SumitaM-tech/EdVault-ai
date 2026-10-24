import * as React from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none focus:border-emerald-400/60', className)} {...props} />;
}
