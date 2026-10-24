import { BadgeCheck, QrCode, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function VerificationCard({ verified, studentName, institution, degree, transaction }: { verified: boolean; studentName: string; institution: string; degree: string; transaction: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
              {verified ? <BadgeCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div>
              <Badge className={verified ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'}>
                {verified ? 'Verified' : 'Pending'}
              </Badge>
              <p className="mt-2 text-lg font-semibold text-white">{studentName}</p>
              <p className="text-sm text-slate-400">{institution}</p>
            </div>
          </div>
          <QrCode className="h-8 w-8 text-slate-500" />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Degree</p><p className="mt-2 text-sm text-white">{degree}</p></div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Transaction</p><p className="mt-2 text-sm text-white">{transaction}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}
