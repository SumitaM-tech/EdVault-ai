import { Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Navbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl glass">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/80 font-semibold">EdVault AI</p>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
        </motion.div>

        <div className="hidden flex-1 items-center justify-center px-8 md:flex">
          <motion.div className="relative w-full max-w-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="border-cyan-500/30 bg-slate-900/40 pl-10 focus:border-cyan-500/60 focus:shadow-lg focus:shadow-cyan-500/20"
              placeholder="Search credentials, students, institutions..."
            />
          </motion.div>
        </div>

        <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Button variant="ghost" size="sm" className="hover:bg-cyan-500/10">
            <Bell className="h-4 w-4 text-cyan-400" />
          </Button>
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-purple-500/10 text-sm font-bold text-cyan-300 glow-cyan"
            whileHover={{ scale: 1.05 }}
          >
            EV
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
