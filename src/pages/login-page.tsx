import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, Lock, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/common/toast';
import { useAuth } from '@/lib/auth-context';

export function LoginPage() {
  const [email, setEmail] = useState('admin@edvault.edu');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      notify({
        title: 'Welcome back',
        description: `Signed in as ${result.user.name} (${result.user.role})`,
      });
    } catch (err) {
      notify({
        title: 'Login failed',
        description: err instanceof Error ? err.message : 'Invalid credentials',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardContent className="p-6 md:p-8">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Sign in</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Welcome back to EdVault AI</h1>
            <p className="mt-2 text-sm text-slate-400">Access institution, student, or recruiter workflows from one verified account.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  className="pl-10"
                  placeholder="you@institution.edu"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  className="pl-10"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Eye className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick login</Label>
              <Select
                defaultValue="admin"
                onChange={(e) => {
                  const role = e.target.value;
                  if (role === 'admin') { setEmail('admin@edvault.edu'); setPassword('password123'); }
                  else if (role === 'student') { setEmail('student@edvault.edu'); setPassword('password123'); }
                  else { setEmail('recruiter@edvault.edu'); setPassword('password123'); }
                }}
              >
                <option value="admin">Admin</option>
                <option value="student">Student</option>
                <option value="recruiter">Recruiter</option>
              </Select>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-white/10 bg-white/5" />
                Remember me
              </label>
              <button type="button" className="text-emerald-300 hover:text-emerald-200" onClick={() => navigate('/')}>
                Back to home
              </button>
            </div>

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Demo: admin@edvault.edu / student@edvault.edu — password123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
