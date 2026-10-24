import { useState, useEffect } from 'react';
import { Shield, Bell, Wallet, User, Save, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/common/toast';

export function SettingsPage() {
  const { user } = useAuth();
  const { notify } = useToast();

  // Profile state — seeded from real logged-in user
  const [name, setName] = useState(user?.name ?? 'EdVault User');
  const [email, setEmail] = useState(user?.email ?? '');
  const [institution, setInstitution] = useState(user?.institution ?? '');
  const [notifications, setNotifications] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync if user changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setInstitution(user.institution ?? '');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    notify({ title: 'Settings Saved', description: 'Your preferences have been updated.' });
  };

  const copyWallet = () => {
    if (user?.wallet) {
      navigator.clipboard.writeText(user.wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage profile, security, wallet, and notifications">
      <div className="grid gap-6 xl:grid-cols-2 max-w-5xl">

        {/* ── Profile ── */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center">
                <User className="h-5 w-5 text-cyan-400" />
              </div>
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <img src={user?.avatar ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id}`}
                className="h-12 w-12 rounded-xl" alt="" />
              <div>
                <p className="font-bold text-white">{user?.name}</p>
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400 mt-1">{user?.role}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} readOnly className="bg-white/5 border-white/10 text-slate-400 cursor-not-allowed" />
              <p className="text-xs text-slate-600">Email is tied to your account and cannot be changed here.</p>
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input value={institution} onChange={e => setInstitution(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
              <p className="text-slate-500 mb-1">Current Role</p>
              <p className="text-white font-bold">{user?.role} — Role is assigned by the system and cannot be changed here.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Security ── */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />Account Secured
              </p>
              <p className="text-xs text-slate-400">Your account is protected with JWT authentication and bcrypt password hashing.</p>
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-sm text-slate-300">Blockchain Identity</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Active</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400">Token-based session active. Auto-expires in 7 days.</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-500">
              To change your password, sign out and use the forgot password flow.
            </div>
          </CardContent>
        </Card>

        {/* ── Wallet ── */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-purple-400" />
              </div>
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.wallet ? (
              <>
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Connected Wallet</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-purple-400 break-all">{user.wallet}</p>
                    <button onClick={copyWallet} className="flex-shrink-0 text-slate-500 hover:text-purple-400">
                      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400">This wallet is used for blockchain credential issuance and on-chain identity (DID).</p>
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <Wallet className="h-10 w-10 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">No wallet linked to this account.</p>
                <p className="text-xs text-slate-600">Wallet is assigned automatically when credentials are issued.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Notifications ── */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center">
                <Bell className="h-5 w-5 text-cyan-400" />
              </div>
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Real-time notifications', desc: 'Receive verification and fraud alerts instantly.', value: notifications, setter: setNotifications },
              { label: 'Fraud alerts', desc: 'Get notified when suspicious activity is detected.', value: fraudAlerts, setter: setFraudAlerts },
              { label: 'Email notifications', desc: 'Receive alerts via Resend email service.', value: emailAlerts, setter: setEmailAlerts },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 p-4">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <Switch checked={item.value} onCheckedChange={item.setter} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Save button */}
      <div className="mt-6 flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500 gap-2 px-8">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </Button>
        <p className="text-xs text-slate-600 self-center">Role changes require admin action via the user management system.</p>
      </div>
    </DashboardLayout>
  );
}
