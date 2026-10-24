import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ShieldCheck, Upload, FileText, Database,
  Link as LinkIcon, CheckCircle2, Loader2, Plus, Mail, Bot, Send, X
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/common/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { fetchDashboardSummary, issueCredential, type IssueResult, sendEmailManual, chatWithAI, consumeFallbackFlag, isAuthError } from '@/lib/api';
import { useToast } from '@/components/common/toast';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeletonGrid, EmptyState } from '@/components/common/loading-state';
import { ApiFallbackBanner } from '@/components/common/api-fallback-banner';
import { UserManagement } from '@/components/common/user-management';
import { getStoredUser } from '@/lib/api';

export function AdminDashboard() {
  const isAdmin = (getStoredUser()?.role ?? '').toUpperCase() === 'ADMIN';
  const [activeTab, setActiveTab] = useState('overview');
  const [isIssuing, setIsIssuing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  // PDF upload
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [lastIssued, setLastIssued] = useState<IssueResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email
  const [emailTo, setEmailTo] = useState('');
  const [emailCredId, setEmailCredId] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // AI Policy Assistant
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([
    { role: 'ai', text: 'I am the EdVault Policy Assistant. Describe a credential submission and I will advise whether to approve, escalate, or reject it.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const { notify } = useToast();

  const loadSummary = () => {
    setLoading(true);
    fetchDashboardSummary()
      .then(s => { setData(s); setOffline(consumeFallbackFlag()); })
      .catch(err => { setData(null); setOffline(!isAuthError(err) && consumeFallbackFlag()); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSummary(); }, []);

  const issuanceSteps = [
    { label: 'Generating Document Hash', icon: ShieldCheck, color: 'text-cyan-400' },
    { label: 'Uploading to IPFS', icon: Database, color: 'text-purple-400' },
    { label: 'AI Fraud Analysis', icon: Bot, color: 'text-cyan-400' },
    { label: 'Writing to Blockchain', icon: LinkIcon, color: 'text-pink-400' },
    { label: 'Credential Issued ✓', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  const handleIssue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
    const formData = {
      studentName: get('studentName'), studentId: get('studentId'),
      institution: get('institution'), degree: get('degree'),
      department: get('department'), cgpa: get('cgpa'), gradDate: get('gradDate'),
      studentEmail: get('studentEmail'),
    };

    setIsIssuing(true); setCurrentStep(0);
    try {
      const request = issueCredential(formData, pdfFile || undefined);
      // Animate the progress steps while the real request runs.
      let step = 0;
      const timer = setInterval(() => { step = Math.min(step + 1, issuanceSteps.length - 2); setCurrentStep(step); }, 700);
      let result;
      try { result = await request; } finally { clearInterval(timer); }
      setCurrentStep(issuanceSteps.length - 1);
      await new Promise(r => setTimeout(r, 400));
      loadSummary();
      setLastIssued(result);
      const simulated = result.blockchain.mock || result.ipfs.mock;
      notify({
        title: 'Credential Issued ✓',
        description: `${result.credential.id} ${simulated ? 'created (simulated anchor/IPFS: see health check)' : 'anchored on blockchain'}.`,
      });
      form.reset();
      setPdfFile(null);
    } catch (err) {
      notify({ title: 'Issuance failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally { setIsIssuing(false); setCurrentStep(0); }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailCredId) return;
    setEmailLoading(true);
    try {
      await sendEmailManual(emailTo, emailCredId);
      notify({ title: 'Email Sent ✓', description: `Credential email sent to ${emailTo}` });
      setEmailTo(''); setEmailCredId('');
    } catch (err) {
      notify({ title: 'Email Failed', description: err instanceof Error ? err.message : 'Check RESEND_API_KEY' });
    } finally { setEmailLoading(false); }
  };

  const handlePolicyChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput('');
    setChatMessages(m => [...m, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const { reply } = await chatWithAI(msg, { institution: 'EdVault University' });
      setChatMessages(m => [...m, { role: 'ai', text: reply }]);
    } catch {
      setChatMessages(m => [...m, { role: 'ai', text: 'Policy assistant unavailable. Check GROQ_API_KEY.' }]);
    } finally { setChatLoading(false); }
  };

  if (loading) return (
    <DashboardLayout title="Admin Command" subtitle="Manage institutional credentials and system security">
      <LoadingSkeletonGrid />
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout title="Admin Command" subtitle="Manage institutional credentials and system security">
      <EmptyState title="Sign in required" description="Sign in at /login with admin@edvault.edu" />
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Admin Command" subtitle="Manage institutional credentials and system security">
      {offline && <ApiFallbackBanner />}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border-white/10 p-1 flex flex-wrap gap-1">
          {[
            ['overview', 'System Overview', 'cyan'],
            ['issue', 'Issue Credential', 'purple'],
            ['email', 'Send Email', 'teal'],
            ['policy', 'Policy Assistant', 'pink'],
            ...(isAdmin ? [['users', 'Users & Roles', 'purple']] : []),
          ].map(([val, label, color]) => (
            <TabsTrigger key={val} value={val}
              className={`data-[state=active]:bg-${color}-500/20 data-[state=active]:text-${color}-400`}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {isAdmin && <TabsContent value="users"><UserManagement /></TabsContent>}

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview">
          <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Students" value={data.stats.totalStudents} hint="Registered accounts" tone="cyan" />
              <StatCard label="Credentials" value={data.stats.credentialsIssued} hint="Verified records" tone="purple" />
              <StatCard label="Verifications" value={data.stats.verificationRequests} hint="All time" tone="pink" />
              <StatCard label="Fraud Alerts" value={data.stats.fraudAlerts} hint="Flagged verifications" tone="green" />
            </div>
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-cyan-400" />Live Verification Feed</CardTitle>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 animate-pulse">Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data.logs.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">No verifications yet. Issue a credential to get started.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead>Credential</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.logs.map((log: any) => (
                        <TableRow key={log.id} className="border-white/5 hover:bg-white/5 group">
                          <TableCell>
                            <Link to={`/credential/${log.credentialId}`} className="font-mono text-xs text-slate-400 group-hover:text-cyan-400 hover:underline">
                              {log.credentialId}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${log.outcome === 'Verified' ? 'bg-emerald-400' : 'bg-pink-400'}`} />
                              <span className={log.outcome === 'Verified' ? 'text-emerald-400' : 'text-pink-400'}>{log.outcome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-slate-500 text-xs">{new Date(log.createdAt).toLocaleTimeString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── ISSUE CREDENTIAL ── */}
        <TabsContent value="issue">
          {lastIssued && (
            <Card className="mb-6 border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-5 space-y-2 text-sm">
                <p className="font-bold text-emerald-400">Issued {lastIssued.credential.id}</p>
                <p className="text-slate-300 break-all">Verification link: <span className="font-mono text-cyan-400">{lastIssued.credential.qrPayload}</span></p>
                <p className="text-slate-400">
                  Anchor: {lastIssued.blockchain.mock ? 'simulated (no chain configured)' : `block #${lastIssued.blockchain.blockNumber}`} · IPFS: {lastIssued.ipfs.mock ? 'simulated' : 'pinned'}
                </p>
                {lastIssued.studentAccount && (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
                    New student account created. Share these once; it will not be shown again:<br />
                    <span className="font-mono">{lastIssued.studentAccount.email}</span> / <span className="font-mono">{lastIssued.studentAccount.temporaryPassword}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Issue New Credential</CardTitle>
                <CardDescription>Fill in student details. The PDF (or, without one, the credential metadata) is hashed, pinned to IPFS and anchored on-chain.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleIssue} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Student Name</Label><Input name="studentName" placeholder="John Doe" className="bg-white/5 border-white/10" required /></div>
                    <div className="space-y-2"><Label>Student ID</Label><Input name="studentId" placeholder="STU-12345" className="bg-white/5 border-white/10" required /></div>
                  </div>
                  <div className="space-y-2"><Label>Student Email — Optional</Label><Input name="studentEmail" type="email" placeholder="student@university.edu" className="bg-white/5 border-white/10" /></div>
                  <div className="space-y-2"><Label>Institution</Label><Input name="institution" defaultValue="EdVault University" className="bg-white/5 border-white/10" required /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Degree</Label><Input name="degree" placeholder="B.Sc. Computer Science" className="bg-white/5 border-white/10" required /></div>
                    <div className="space-y-2"><Label>Department</Label><Input name="department" placeholder="Engineering" className="bg-white/5 border-white/10" required /></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>CGPA</Label><Input name="cgpa" placeholder="3.95" className="bg-white/5 border-white/10" required /></div>
                    <div className="space-y-2"><Label>Graduation Date</Label><Input name="gradDate" type="date" className="bg-white/5 border-white/10" required /></div>
                  </div>
                  {/* PDF Upload */}
                  <div className="space-y-2">
                    <Label>Upload Certificate (PDF) — Optional</Label>
                    <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden"
                      onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                    <div
                      className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-cyan-500/40 transition-colors cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); setPdfFile(e.dataTransfer.files[0] || null); }}>
                      {pdfFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="h-5 w-5 text-cyan-400" />
                          <span className="text-sm text-cyan-400">{pdfFile.name}</span>
                          <button type="button" onClick={e => { e.stopPropagation(); setPdfFile(null); }}>
                            <X className="h-4 w-4 text-slate-400 hover:text-red-400" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-7 w-7 text-slate-500 mx-auto mb-2 group-hover:text-cyan-400 transition-colors" />
                          <p className="text-sm text-slate-400">Drag and drop or click to upload</p>
                          <p className="text-xs text-slate-600 mt-1">PDF only · hashed and pinned to IPFS · Max 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-6 text-lg font-semibold" disabled={isIssuing}>
                    {isIssuing ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Issuing...</> : <><Plus className="h-5 w-5 mr-2" />Issue Credential</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {isIssuing ? (
                <motion.div key="issuing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                  <Card className="border-cyan-500/30 bg-cyan-500/5 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-cyan-400" />Issuance Protocol Active</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 py-8">
                      {issuanceSteps.map((step, i) => {
                        const Icon = step.icon;
                        const isActive = currentStep === i;
                        const isDone = currentStep > i;
                        return (
                          <div key={i} className="relative flex items-center gap-4">
                            {i < issuanceSteps.length - 1 && (
                              <div className={`absolute left-5 top-10 w-0.5 h-10 ${isDone ? 'bg-cyan-500' : 'bg-white/10'}`} />
                            )}
                            <div className={`z-10 h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-cyan-500 border-cyan-500' : isActive ? 'bg-cyan-500/20 border-cyan-500 animate-pulse' : 'bg-white/5 border-white/10'}`}>
                              {isDone ? <CheckCircle2 className="h-6 w-6 text-white" /> : <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />}
                            </div>
                            <p className={`font-medium ${isActive ? 'text-cyan-400' : isDone ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hidden lg:flex items-center justify-center p-12 border-2 border-dashed border-white/5 rounded-3xl">
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-300">Ready for Issuance</h3>
                    <p className="text-slate-500 text-sm">Fill in student details to begin the blockchain verification and document storage protocol.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* ── SEND EMAIL ── */}
        <TabsContent value="email">
          <div className="max-w-lg">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-cyan-400" />Send Credential Email</CardTitle>
                <CardDescription>Send a verified credential link to a student or recruiter via Resend. Requires RESEND_API_KEY in backend/.env.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Recipient Email</Label>
                    <Input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)}
                      placeholder="student@example.com" className="bg-white/5 border-white/10" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Credential ID</Label>
                    <Input value={emailCredId} onChange={e => setEmailCredId(e.target.value)}
                      placeholder="CRED-XXXXXXXX" className="bg-white/5 border-white/10 font-mono" required />
                  </div>
                  <Button type="submit" disabled={emailLoading || !emailTo || !emailCredId}
                    className="w-full bg-teal-600 hover:bg-teal-500 gap-2 py-5">
                    {emailLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : <><Mail className="h-4 w-4" />Send Email</>}
                  </Button>
                  <p className="text-xs text-slate-600">Note: Free Resend keys send from onboarding@resend.dev. Verify your domain at resend.com for custom sender.</p>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── POLICY ASSISTANT ── */}
        <TabsContent value="policy">
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-pink-400" />AI Policy Assistant</CardTitle>
              <CardDescription>Describe a credential submission — AI advises approve, escalate, or reject. Final decision always rests with the admin.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-3 mb-4 pr-1">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'ai' && (
                      <div className="h-8 w-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-pink-400" />
                      </div>
                    )}
                    <div className={`max-w-sm lg:max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-pink-400 animate-pulse" />
                    </div>
                    <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-sm text-slate-400 animate-pulse">Analysing...</div>
                  </div>
                )}
              </div>
              <form onSubmit={handlePolicyChat} className="flex gap-2">
                <Input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder="Describe the credential submission for policy review..."
                  className="bg-white/5 border-white/10" disabled={chatLoading} />
                <Button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-pink-600 hover:bg-pink-500 px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-xs text-slate-600 mt-3">⚠️ AI recommendations are advisory only. Human admin approval is required for all credential decisions.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
