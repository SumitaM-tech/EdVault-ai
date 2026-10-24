import { AlertTriangle } from 'lucide-react';
import { API_URL } from '@/lib/api';

export function ApiFallbackBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div>
        <p className="font-medium text-amber-100">Demo mode — API unreachable</p>
        <p className="mt-0.5 text-amber-200/80">
          Could not connect to the backend at {API_URL}. Showing cached demo data.
          Start the API with <code className="rounded bg-black/30 px-1">cd backend && npm run dev</code>.
        </p>
      </div>
    </div>
  );
}
