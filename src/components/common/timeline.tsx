import { CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TimelineEvent } from '@/types';

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white">Verification Timeline</h3>
        <div className="mt-6 space-y-4">
          {events.map((event) => {
            const Icon = event.tone === 'success' ? CheckCircle2 : event.tone === 'warning' ? AlertTriangle : Clock3;
            return (
              <div key={event.title} className="flex gap-4">
                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 border-b border-white/8 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{event.title}</p>
                    <p className="text-xs text-slate-500">{event.timestamp}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{event.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
