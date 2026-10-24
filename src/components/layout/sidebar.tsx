import { 
  Activity, 
  Award, 
  BadgeCheck, 
  Building2, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  Users,
  Search,
  BrainCircuit,
  Database,
  User
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const items = [
  { to: '/admin', label: 'Admin Command', icon: LayoutDashboard },
  { to: '/student', label: 'Digital Passport', icon: User },
  { to: '/verify', label: 'Public Verifier', icon: Search },
  { to: '/ai', label: 'AI Sentinel', icon: BrainCircuit },
  { to: '/ledger', label: 'Ledger Explorer', icon: Database },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { logout } = useAuth();
  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl p-4 lg:flex lg:flex-col glass-dark">
      {/* Logo */}
      <motion.div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/5 p-4 mb-4 glow-cyan" whileHover={{ scale: 1.02 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">EdVault AI</p>
            <p className="text-xs text-cyan-400/70">Unified Trust Layer</p>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-300',
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300 border border-transparent',
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Wallet Section */}
      <motion.div className="rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4 mb-4 glow-purple" whileHover={{ scale: 1.02 }}>
        <p className="text-sm font-semibold text-white">Network Status</p>
        <p className="mt-1 text-xs text-purple-400/70 font-mono">Mainnet • Block 15.4M</p>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <Activity className="h-3.5 w-3.5 text-neon-green" />
          <span className="text-neon-green font-medium">Nodes Synced (100%)</span>
        </div>
      </motion.div>

      {/* Sign Out Button */}
      <motion.button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-all duration-300 hover:bg-pink-500/10 hover:text-pink-300 border border-transparent hover:border-pink-500/30"
        whileHover={{ x: 5 }}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </motion.button>
    </aside>
  );
}
