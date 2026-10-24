import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, QrCode, ShieldCheck, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, Copy, Hash, Database, User, X, FileUp, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchVerificationResult, searchStudents, extractCredentialId, isAuthError, type VerificationResult } from '@/lib/api';
import { useToast } from '@/components/common/toast';
import { Link, useParams } from 'react-router-dom';

type Tab = 'id' | 'qr' | 'student';

export function RecruiterVerificationPage() {
  const [tab, setTab] = useState<Tab>('id');
  const [query, setQuery] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [studentSearching, setStudentSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [checkedId, setCheckedId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { notify } = useToast();
  const { id: routeId } = useParams();

  const runVerify = async (rawId: string, file?: File | null) => {
    const id = extractCredentialId(rawId);
    if (!id) return;
    setQuery(id);
    setCheckedId(id);
    setIsVerifying(true);
    setResult(null);
    try {
      const res = await fetchVerificationResult({ credentialId: id }, file ?? undefined);
      setResult(res);
      notify({
        title: res.verified ? 'Verified' : res.credential ? 'Verification failed' : 'Not found',
        description: res.verified ? 'Credential matches its anchored record.' : res.credential ? 'The credential did not pass every check.' : 'No record found for that ID.',
      });
    } catch (err) {
      setResult({ verified: false, student: null, credential: null, blockchainTx: '', status: 'Flagged' });
      notify({ title: 'Verification unavailable', description: err instanceof Error ? err.message : 'Could not reach verification service.' });
    } finally { setIsVerifying(false); }
  };

  // Opening a QR link (/verify/CRED-XXXX) verifies immediately.
  useEffect(() => { if (routeId) { void runVerify(routeId); } }, [routeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = (e: React.FormEvent) => { e.preventDefault(); void runVerify(query, docFile); };

  const handleStudentSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQuery.trim()) return;
    setStudentSearching(true);
    try {
      const results = await searchStudents(studentQuery);
      setStudentResults(results);
      if (!results.length) notify({ title: 'No results', description: 'No students found matching that query.' });
    } catch (err) {
      notify({
        title: isAuthError(err) ? 'Sign in required' : 'Error',
        description: isAuthError(err) ? 'Student search is available to signed-in staff and recruiters.' : 'Search failed.',
      });
    } finally { setStudentSearching(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const tabs = [
    { key: 'id' as Tab, icon: Hash, label: 'Credential ID', desc: 'Verify using the unique credential ID' },
    { key: 'qr' as Tab, icon: QrCode, label: 'QR Link', desc: 'Scan the QR code, or paste its link' },
    { key: 'student' as Tab, icon: User, label: 'Student Search', desc: 'Find and verify by student name' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm">
            <ShieldCheck className="h-4 w-4" />Public Verification Portal
          </div>
          <h1 className="text-5xl font-black tracking-tighter">
            Verify <span className="text-cyan-400">Academic</span> <span className="text-purple-400">Integrity</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">Instantly validate institutional credentials using blockchain-anchored verification.</p>
        </motion.div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setResult(null); setStudentResults([]); }}
              className={`p-4 rounded-2xl border text-left transition-all ${tab === t.key ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              <t.icon className="h-6 w-6 mb-2" />
              <p className="text-sm font-bold">{t.label}</p>
              <p className="text-xs opacity-70 mt-1">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* ── Tab: Credential ID ── */}
        {tab === 'id' && (
          <form onSubmit={handleVerify} className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <Input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Enter Credential ID (e.g. CRED-DEMO0001)"
                className="pl-12 h-14 text-lg bg-white/5 border-white/10 rounded-2xl"
              />
            </div>
            <Button type="submit" disabled={isVerifying || !query.trim()} className="h-14 px-8 bg-cyan-600 hover:bg-cyan-500 rounded-2xl text-lg font-bold">
              {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Now'}
            </Button>
          </form>
        )}
        {tab === 'id' && (
          <div className="mb-8 flex items-center gap-3 text-sm text-slate-400">
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
              <FileUp className="h-4 w-4" />{docFile ? docFile.name : 'Optional: attach the PDF to check it against the anchored hash'}
            </button>
            {docFile && <button type="button" onClick={() => setDocFile(null)} className="text-slate-500 hover:text-red-400"><X className="h-4 w-4" /></button>}
          </div>
        )}

        {/* ── Tab: QR Payload ── */}
        {tab === 'qr' && (
          <div className="space-y-4 mb-8">
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center space-y-4">
              <QrCode className="h-12 w-12 text-slate-500 mx-auto" />
              <p className="text-slate-400">Scanning the QR code with a phone opens this page automatically. You can also paste its link here.</p>
              <form onSubmit={handleVerify} className="flex gap-3">
                <Input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="http://…/verify/CRED-XXXX or just CRED-XXXX"
                  className="bg-white/5 border-white/10 h-12"
                />
                <Button type="submit" disabled={isVerifying || !query.trim()} className="bg-cyan-600 hover:bg-cyan-500 h-12 px-6">
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                </Button>
              </form>
              <p className="text-xs text-slate-600">Older certificates may carry an edvault://credential/… payload; that works here too.</p>
            </div>
          </div>
        )}

        {/* ── Tab: Student Search ── */}
        {tab === 'student' && (
          <div className="space-y-4 mb-8">
            <form onSubmit={handleStudentSearch} className="flex gap-3">
              <Input value={studentQuery} onChange={e => setStudentQuery(e.target.value)}
                placeholder="Search by student name..."
                className="h-12 bg-white/5 border-white/10 rounded-xl"
              />
              <Button type="submit" disabled={studentSearching || !studentQuery.trim()} className="h-12 bg-cyan-600 hover:bg-cyan-500 px-6 rounded-xl">
                {studentSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
            {studentResults.length > 0 && (
              <div className="space-y-3">
                {studentResults.map((s: any) => (
                  <Card key={s.id} className="border-white/10 bg-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{s.name}</p>
                          <p className="text-sm text-slate-400">{s.institution ?? '—'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.credentials?.map((c: any) => (
                            <button key={c.id} onClick={() => { setTab('id'); setQuery(c.id); setStudentResults([]); }}
                              className="text-xs font-mono px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20">
                              {c.id}
                            </button>
                          ))}
                          {(!s.credentials || s.credentials.length === 0) && <span className="text-xs text-slate-500">No credentials</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Result ── */}
        <AnimatePresence mode="wait">
          {isVerifying && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16 space-y-4">
              <div className="h-16 w-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin mx-auto" />
              <p className="text-cyan-400 font-medium">Checking the record...</p>
            </motion.div>
          )}

          {!isVerifying && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {result.verified ? (
                <>
                  <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-9 w-9 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">✓ VERIFIED</h2>
                          <p className="text-emerald-400">
                            {result.checks?.anchor === 'live' ? 'Matches the record anchored on the blockchain' : 'Matches the database record (not anchored on a live chain)'}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {result.checks?.anchor === 'live' && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">On-chain hash match ✓</Badge>}
                            {result.checks?.signatureValid === true && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Issuer signature ✓</Badge>}
                            {result.checks?.documentChecked && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Document match ✓</Badge>}
                            {result.checks?.auditLogged && <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Audit entry written on-chain</Badge>}
                            {result.checks?.anchor === 'simulated' && <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Simulated anchor</Badge>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-white/10 bg-white/5">
                      <CardHeader><CardTitle className="text-sm text-slate-500 uppercase tracking-widest">Student</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={result.student?.avatar} className="h-10 w-10 rounded-xl bg-white/5" alt="" />
                          <div>
                            <p className="font-bold text-white">{result.student?.name}</p>
                            <p className="text-xs text-slate-400">{result.student?.institution}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-sm">
                          <div><p className="text-xs text-slate-500">Degree</p><p className="text-slate-200">{result.credential?.title}</p></div>
                          <div><p className="text-xs text-slate-500">Issued</p><p className="text-slate-200">{result.credential ? new Date(result.credential.issuedAt).toLocaleDateString() : ''}</p></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                      <CardHeader><CardTitle className="text-sm text-slate-500 uppercase tracking-widest">Blockchain Record</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-slate-500">Transaction Hash</p>
                            <button onClick={() => copy(result.credential?.blockchainTx ?? '')} className="text-slate-500 hover:text-cyan-400">
                              {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <p className="font-mono text-xs text-cyan-400 bg-cyan-400/5 p-2 rounded border border-cyan-400/20 break-all">{result.credential?.blockchainTx}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-sm">
                          <div><p className="text-xs text-slate-500">Credential ID</p><p className="text-slate-200 font-mono text-xs">{result.credential?.id}</p></div>
                          <div><p className="text-xs text-slate-500">Status</p><p className="text-emerald-400">{result.status}</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-3">
                    <Link to={`/credential/${result.credential?.id}`} className="flex-1">
                      <Button className="w-full bg-white/10 hover:bg-white/20 gap-2"><ExternalLink className="h-4 w-4" />View Full Details</Button>
                    </Link>
                    <Button variant="ghost" className="text-slate-400 hover:text-white gap-2" onClick={() => { setResult(null); setQuery(''); }}>
                      <X className="h-4 w-4" />Clear
                    </Button>
                  </div>
                </>
              ) : (
                result.credential ? (
                  <Card className="border-pink-500/30 bg-pink-500/5 p-8">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-10 w-10 text-pink-500 shrink-0" />
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">Verification failed</h3>
                        <ul className="text-sm text-slate-300 list-disc pl-5 space-y-1">
                          {result.checks?.revoked && <li>This credential has been revoked by the issuer.</li>}
                          {result.checks?.signatureValid === false && <li>The issuer's digital signature is invalid: the record may have been tampered with.</li>}
                          {result.simulated && <li>The blockchain anchor is simulated, so this result cannot be trusted as proof.</li>}
                          {result.checks && !result.checks.hashMatched && <li>The stored record does not match the hash anchored on-chain.</li>}
                          {result.checks?.documentChecked && !result.checks.documentMatched && <li>The document you supplied does not match the issued document.</li>}
                        </ul>
                        <Button variant="outline" className="mt-2 border-pink-500/30 text-pink-400 hover:bg-pink-500/10" onClick={() => { setResult(null); setQuery(''); setDocFile(null); }}>
                          Check another credential
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                <Card className="border-pink-500/30 bg-pink-500/5 text-center p-10">
                  <AlertCircle className="h-14 w-14 text-pink-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Not Found</h3>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto">No record found for <span className="font-mono text-pink-400">{checkedId || query}</span>. Check the ID and try again.</p>
                  <Button variant="outline" className="mt-6 border-pink-500/30 text-pink-400 hover:bg-pink-500/10" onClick={() => { setResult(null); setQuery(''); }}>
                    Try Another ID
                  </Button>
                </Card>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info badges */}
        {!result && !isVerifying && tab === 'id' && (
          <div className="flex justify-center gap-4 mt-4">
            {['Hash checked against the chain', 'Optional document comparison', 'On-chain audit log'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
