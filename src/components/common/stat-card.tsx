import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  tone = 'cyan',
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: 'cyan' | 'purple' | 'pink' | 'green';
}) {
  const tones = {
    cyan: { bg: 'from-cyan-500/10 to-blue-500/5', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'glow-cyan' },
    purple: { bg: 'from-purple-500/10 to-pink-500/5', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'glow-purple' },
    pink: { bg: 'from-pink-500/10 to-rose-500/5', text: 'text-pink-400', border: 'border-pink-500/20', glow: 'glow-pink' },
    green: { bg: 'from-neon-green/10 to-teal-500/5', text: 'text-neon-green', border: 'border-green-500/20', glow: 'glow-green' },
  };

  const theme = tones[tone];

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
          `bg-gradient-to-br ${theme.bg}`,
          theme.glow,
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 uppercase tracking-wide">{label}</p>
              <motion.p
                className={cn('mt-3 text-3xl font-bold tracking-tight font-mono', theme.text)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {value}
              </motion.p>
              <p className="mt-2 text-xs text-slate-400">{hint}</p>
            </div>
            <motion.div
              className={cn('w-1 h-12 rounded-full bg-gradient-to-b', theme.bg)}
              animate={{ height: [48, 60, 48] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
