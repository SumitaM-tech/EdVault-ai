import { Download, Share2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Credential } from '@/types';

export function CredentialCard({ credential }: { credential: Credential }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified':
        return { bg: 'from-neon-green/10 to-emerald-500/5', border: 'border-neon-green/30', text: 'text-neon-green', badge: 'bg-neon-green/20 border-neon-green/50 text-neon-green' };
      case 'Pending':
        return { bg: 'from-cyan-500/10 to-blue-500/5', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' };
      default:
        return { bg: 'from-pink-500/10 to-rose-500/5', border: 'border-pink-500/30', text: 'text-pink-400', badge: 'bg-pink-500/20 border-pink-500/50 text-pink-300' };
    }
  };

  const colors = getStatusColor(credential.status);

  return (
    <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ duration: 0.3 }} className="h-full">
      <Card className={`relative overflow-hidden h-full border-2 ${colors.border} bg-gradient-to-br ${colors.bg} transition-all duration-300 hover:shadow-lg`}>
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top_right,${colors.text}/0.1,transparent_45%)]`} />
        <CardContent className="relative p-6 h-full flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Badge className={`border ${colors.badge}`}>{credential.status}</Badge>
              <h3 className="mt-4 text-lg font-bold text-white">{credential.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{credential.institution}</p>
            </div>
            <motion.div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border ${colors.border} bg-gradient-to-br from-slate-800/50 to-slate-900/30 ${colors.text}`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {credential.status === 'Verified' ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </motion.div>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-slate-300 md:grid-cols-2 flex-1">
            <motion.div
              className={`rounded-lg border ${colors.border} bg-slate-800/40 p-4`}
              whileHover={{ backgroundColor: 'rgba(0, 245, 255, 0.05)' }}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">Issued</p>
              <p className="mt-2 font-mono text-sm text-white">{credential.issuedAt}</p>
            </motion.div>
            <motion.div
              className={`rounded-lg border ${colors.border} bg-slate-800/40 p-4`}
              whileHover={{ backgroundColor: 'rgba(0, 245, 255, 0.05)' }}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">Credential ID</p>
              <p className="mt-2 font-mono text-xs text-slate-300 truncate">{credential.id}</p>
            </motion.div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="sm" variant="default">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button size="sm" variant="neon">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
