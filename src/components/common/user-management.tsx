import { useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchUsers, createUser, changeUserRole, type AdminUser, type AppRole } from '@/lib/api';
import { useToast } from '@/components/common/toast';

const ROLES: AppRole[] = ['ADMIN', 'FACULTY', 'RECRUITER', 'STUDENT'];
const selectCls = 'bg-slate-900 border border-white/10 rounded-md text-sm text-white px-2 py-1.5';

export function UserManagement() {
  const { notify } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', role: 'FACULTY' as AppRole, institution: '' });
  const [saving, setSaving] = useState(false);
  const [tempPw, setTempPw] = useState<{ email: string; password: string } | null>(null);

  const load = () => fetchUsers().then(setUsers).catch(e => notify({ title: 'Could not load users', description: e.message })).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await createUser({ ...form, institution: form.institution || undefined });
      setTempPw({ email: r.user.email, password: r.temporaryPassword });
      setForm({ name: '', email: '', role: 'FACULTY', institution: '' });
      await load();
    } catch (err) { notify({ title: 'Could not create user', description: err instanceof Error ? err.message : 'Failed' }); }
    finally { setSaving(false); }
  };

  const setRole = async (u: AdminUser, role: AppRole) => {
    try { await changeUserRole(u.id, role); notify({ title: 'Role updated', description: `${u.email} is now ${role}` }); await load(); }
    catch (err) { notify({ title: 'Could not change role', description: err instanceof Error ? err.message : 'Failed' }); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="bg-white/5 border-white/10 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><UserPlus className="h-4 w-4 text-cyan-400" />Add user</CardTitle>
          <CardDescription>Create faculty, recruiter, student or admin accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input required minLength={2} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Institution / company</Label><Input value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} /></div>
            <div className="space-y-1"><Label>Role</Label>
              <select className={`${selectCls} w-full`} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as AppRole })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={saving} className="w-full bg-cyan-600 hover:bg-cyan-500">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create user'}
            </Button>
          </form>
          {tempPw && (
            <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-slate-200 break-all">
              Temporary password for <b>{tempPw.email}</b> (shown once):<br /><code className="text-cyan-300">{tempPw.password}</code>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 lg:col-span-2">
        <CardHeader><CardTitle className="text-white">Users &amp; roles</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="text-white">{u.name}</TableCell>
                    <TableCell className="text-slate-400">{u.email}</TableCell>
                    <TableCell>
                      <select className={selectCls} value={u.role} onChange={e => setRole(u, e.target.value as AppRole)}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {u.role === 'ADMIN' && <Badge className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30">admin</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
