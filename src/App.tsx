import { Navigate, Route, Routes, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, User, Search, Database, BrainCircuit, Menu, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { LandingPage } from './pages/landing-page';
import { LoginPage } from './pages/login-page';
import { AdminDashboard } from './pages/admin-dashboard';
import { StudentDashboard } from './pages/student-dashboard';
import { RecruiterVerificationPage } from './pages/recruiter-verification-page';
import { CredentialDetailsPage } from './pages/credential-details-page';
import { AIFraudDetectionDashboard } from './pages/ai-fraud-detection-dashboard';
import { BlockchainExplorerPage } from './pages/blockchain-explorer';
import { SettingsPage } from './pages/settings-page';
import { ToastProvider } from './components/common/toast';
import { Button } from './components/ui/button';
import { useAuth } from './lib/auth-context';

function DemoNavigationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/admin',   label: 'Admin Dashboard',  icon: LayoutDashboard, color: 'text-cyan-400',    roles: ['ADMIN','FACULTY'] },
    { to: '/student', label: 'Student Passport',  icon: User,            color: 'text-purple-400',  roles: ['STUDENT'] },
    { to: '/verify',  label: 'Verify Credential', icon: Search,          color: 'text-emerald-400', roles: ['ADMIN','FACULTY','RECRUITER','STUDENT'] },
    { to: '/ledger',  label: 'Ledger Explorer',   icon: Database,        color: 'text-pink-400',    roles: ['ADMIN','FACULTY'] },
    { to: '/ai',      label: 'AI Sentinel',        icon: BrainCircuit,    color: 'text-cyan-400',  roles: ['ADMIN'] },
  ];

  const visible = user
    ? navItems.filter(i => i.roles.includes(user.role.toUpperCase()) || i.roles.includes(user.role))
    : navItems;

  return (
    <div className="fixed top-6 right-6 z-[100]">
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-12 w-12 rounded-full shadow-2xl transition-all duration-500 ${isOpen ? 'bg-pink-500 rotate-90' : 'bg-cyan-600 hover:bg-cyan-500'}`}
          size="icon"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Zap className="h-6 w-6 animate-pulse" />}
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute top-16 right-0 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-2 space-y-1"
            >
              <div className="px-3 py-2 border-b border-white/5 mb-2">
                {user ? (
                  <div>
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500">{user.role} · {user.email}</p>
                  </div>
                ) : (
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Navigation</p>
                )}
              </div>
              {visible.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to} onClick={() => setIsOpen(false)}>
                    <motion.div
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive ? 'bg-white/10' : ''}`}
                    >
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
              {user ? (
                <button
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors mt-1 border-t border-white/5"
                >
                  <X className="h-5 w-5" />
                  <span className="text-sm font-bold">Sign Out</span>
                </button>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 px-3 py-3 rounded-xl border-t border-white/5 mt-1">
                    <User className="h-5 w-5 text-cyan-400" />
                    <span className="text-sm font-bold text-cyan-400">Sign In</span>
                  </motion.div>
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.some(r => r.toLowerCase() === user.role.toLowerCase())) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <DemoNavigationPanel />
      <Routes>
        <Route path="/"       element={<Navigate to="/login" replace />} />
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/verify" element={<RecruiterVerificationPage />} />
        <Route path="/verify/:id" element={<RecruiterVerificationPage />} />
        <Route path="/admin"  element={<ProtectedRoute roles={['admin','faculty']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute roles={['student','admin','faculty']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/credential/:id" element={<ProtectedRoute roles={[]}><CredentialDetailsPage /></ProtectedRoute>} />
        <Route path="/ai"     element={<ProtectedRoute roles={['admin']}><AIFraudDetectionDashboard /></ProtectedRoute>} />
        <Route path="/ledger" element={<ProtectedRoute roles={['admin','faculty']}><BlockchainExplorerPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={[]}><SettingsPage /></ProtectedRoute>} />
        <Route path="*"       element={<Navigate to="/login" replace />} />
      </Routes>
    </ToastProvider>
  );
}
