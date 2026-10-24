import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BadgeCheck, Download, Share2, QrCode, ExternalLink, Award,
  BookOpen, Calendar, Globe, Mail, Wallet, Zap, X, Copy, CheckCircle2, Loader2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSkeletonGrid, EmptyState } from '@/components/common/loading-state';
import { fetchMyDid, fetchStudentProfile, fetchAISummary, shareCredential, consumeFallbackFlag, isAuthError } from '@/lib/api';
import { ApiFallbackBanner } from '@/components/common/api-fallback-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Student, Credential } from '@/types';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/toast';
import QRCode from '@/components/common/qr-display';

export function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [did, setDid] = useState('');
  useEffect(() => { fetchMyDid().then(r => setDid(r.did)).catch(() => {}); }, []);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [qrModal, setQrModal] = useState<Credential | null>(null);
  const [shareModal, setShareModal] = useState<Credential | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    fetchStudentProfile()
      .then(p => { setStudent(p); setOffline(consumeFallbackFlag()); })
      .catch(err => { setStudent(null); setOffline(!isAuthError(err) && consumeFallbackFlag()); })
      .finally(() => setLoading(false));
  }, []);

  const handleAISummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetchAISummary();
      setAiSummary(res.summary);
    } catch {
      setAiSummary('AI summary unavailable. Check your Groq API key.');
    } finally { setSummaryLoading(false); }
  };

  const handleShare = async () => {
    if (!shareModal) return;
    setShareLoading(true);
    try {
      const res = await shareCredential(shareModal.id, shareEmail || undefined);
      setShareLink(res.shareLink);
      notify({ title: 'Link Generated', description: shareEmail ? `Email sent to ${shareEmail}` : 'Share link created.' });
    } catch {
      notify({ title: 'Error', description: 'Could not create share link.' });
    } finally { setShareLoading(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (loading) return <DashboardLayout title="Digital Passport" subtitle="Your verified academic identity on the blockchain"><LoadingSkeletonGrid /></DashboardLayout>;
  if (!student) return <DashboardLayout title="Digital Passport" subtitle="Your verified academic identity on the blockchain"><EmptyState title="Sign in required" description="Sign in at /login with student@edvault.edu" /></DashboardLayout>;

  return (
    <DashboardLayout title="Digital Passport" subtitle="Your verified academic identity on the blockchain">
      {offline && <ApiFallbackBanner />}
      {did && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 break-all">
          <span className="text-cyan-400 font-semibold">Decentralized ID: </span>{did}
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setQrModal(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-8 space-y-4 max-w-xs w-full mx-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">QR Code</h3>
              <button onClick={() => setQrModal(null)}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="bg-white p-4 rounded-xl flex items-center justify-center">
              <QRCode value={qrModal.qrPayload} size={200} />
            </div>
            <p className="text-xs text-slate-500 text-center font-mono break-all">{qrModal.id}</p>
            <Button className="w-full bg-cyan-600 hover:bg-cyan-500 gap-2" onClick={() => { copyToClipboard(qrModal.qrPayload); notify({ title: 'Copied', description: 'Verification link copied to clipboard.' }); }}>
              <Copy className="h-4 w-4" />Copy Link
            </Button>
          </motion.div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => { setShareModal(null); setShareLink(''); setShareEmail(''); }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-8 space-y-4 max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Share Credential</h3>
              <button onClick={() => { setShareModal(null); setShareLink(''); setShareEmail(''); }}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
            </div>
            <p className="text-sm text-slate-400">Share <span className="text-cyan-400 font-mono">{shareModal.id}</span> securely</p>
            <div className="space-y-2">
              <Label>Send via Email (optional)</Label>
              <Input value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="recruiter@company.com" className="bg-white/5 border-white/10" type="email" />
            </div>
            <Button onClick={handleShare} disabled={shareLoading} className="w-full bg-purple-600 hover:bg-purple-500 gap-2">
              {shareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              {shareLoading ? 'Generating...' : 'Generate Share Link'}
            </Button>
            {shareLink && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Share Link</p>
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly className="bg-white/5 border-white/10 text-xs font-mono text-cyan-400" />
                  <Button size="icon" variant="ghost" onClick={() => { copyToClipboard(shareLink); setCopied(true); }}>
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <motion.div className="grid gap-6 lg:grid-cols-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Profile Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20" />
            <CardContent className="pt-12 text-center relative">
              <div className="relative inline-block">
                <img src={student.avatar} alt={student.name} className="h-24 w-24 rounded-3xl border-4 border-black bg-slate-800 mx-auto" />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 border-2 border-black">
                  <BadgeCheck className="h-4 w-4 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mt-4">{student.name}</h2>
              <p className="text-cyan-400 font-medium">{student.degree}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-300">Class of {student.year}</Badge>
                <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-300">{student.institution}</Badge>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 space-y-4 text-left">
                <div className="flex items-center gap-3 text-slate-400"><Mail className="h-4 w-4" /><span className="text-sm">{student.email}</span></div>
                <div className="flex items-center gap-3 text-slate-400"><Globe className="h-4 w-4" /><span className="text-sm">{student.institution}</span></div>
                {student.wallet && <div className="flex items-center gap-3 text-slate-400"><Wallet className="h-4 w-4" /><span className="text-sm font-mono">{student.wallet.slice(0, 6)}...{student.wallet.slice(-4)}</span></div>}
              </div>
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-cyan-400" />AI Academic Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {aiSummary ? (
                <p className="text-sm text-slate-300 leading-relaxed">{aiSummary}</p>
              ) : (
                <p className="text-sm text-slate-500">Generate an AI-powered summary of your academic achievements.</p>
              )}
              <Button onClick={handleAISummary} disabled={summaryLoading} className="w-full bg-cyan-600/80 hover:bg-cyan-600 text-white gap-2" size="sm">
                {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {summaryLoading ? 'Generating...' : aiSummary ? 'Regenerate' : 'Generate Summary'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-cyan-400" />Verified Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['TypeScript', 'Blockchain', 'Smart Contracts', 'React', 'Cryptography', 'Data Science'].map(skill => (
                  <Badge key={skill} className="bg-white/5 text-slate-300 hover:bg-white/10 border-white/10 py-1.5 px-3">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credentials Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-purple-400" />Academic Credentials
            </h3>
            <span className="text-sm text-slate-500">{student.credentials.length} Records</span>
          </div>

          <div className="grid gap-4">
            {student.credentials.map((cred, i) => (
              <motion.div key={cred.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="group border-white/10 bg-black/40 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-2 bg-purple-500/50 group-hover:bg-purple-500 transition-colors" />
                      <div className="p-6 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{cred.title}</h4>
                            <p className="text-slate-400 text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" />{cred.institution}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" />Issued: {new Date(cred.issuedAt).toLocaleDateString()}</span>
                              <Badge className={`${cred.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : cred.status === 'Revoked' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                                {cred.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {/* Working QR button */}
                            <Button size="icon" variant="ghost" className="hover:bg-purple-500/10 hover:text-purple-400 text-slate-500"
                              onClick={() => setQrModal(cred)} title="View QR Code">
                              <QrCode className="h-5 w-5" />
                            </Button>
                            {/* Working Share button */}
                            <Button size="icon" variant="ghost" className="hover:bg-purple-500/10 hover:text-purple-400 text-slate-500"
                              onClick={() => { setShareModal(cred); setShareLink(''); setShareEmail(''); }} title="Share Credential">
                              <Share2 className="h-5 w-5" />
                            </Button>
                            {/* Download — copies hash to clipboard */}
                            <Button size="icon" variant="ghost" className="hover:bg-purple-500/10 hover:text-purple-400 text-slate-500"
                              onClick={() => { copyToClipboard(`Credential: ${cred.id}\nHash: ${cred.hash}\nTx: ${cred.blockchainTx}`); notify({ title: 'Downloaded', description: 'Credential details copied.' }); }}
                              title="Download Details">
                              <Download className="h-5 w-5" />
                            </Button>
                            <Link to={`/credential/${cred.id}`}>
                              <Button variant="secondary" className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-1">
                                <ExternalLink className="h-3 w-3" />View
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-500">
                          <span>CID: {cred.cid.slice(0, 20)}...</span>
                          <span className="hidden sm:inline">TX: {cred.blockchainTx.slice(0, 16)}...</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {student.credentials.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No credentials issued yet. Ask your institution admin to issue one.</p>
              </div>
            )}
          </div>

          {/* Academic Timeline */}
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-lg">Academic Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-8 relative before:absolute before:inset-0 before:left-2 before:h-full before:w-0.5 before:bg-white/5">
                {student.credentials.length > 0 ? student.credentials.map((cred, i) => (
                  <div key={cred.id} className="relative pl-10">
                    <div className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-black ${cred.status === 'Verified' ? 'bg-emerald-500' : cred.status === 'Revoked' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{cred.title}</span>
                        <span className="text-xs text-slate-500">• {new Date(cred.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-400">{cred.institution}</p>
                      <p className="text-xs font-mono text-slate-600">{cred.id}</p>
                    </div>
                  </div>
                )) : (
                  [
                    { title: 'Account Created', date: 'Today', desc: 'Your EdVault identity is active', type: 'success' },
                  ].map((item, i) => (
                    <div key={i} className="relative pl-10">
                      <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-black bg-cyan-500" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{item.title}</span>
                          <span className="text-xs text-slate-500">• {item.date}</span>
                        </div>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
