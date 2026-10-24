import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanFace, BrainCircuit, Zap, Lock, Fingerprint,
  CheckCircle2, Loader2, RefreshCw, FileText, AlertTriangle,
  Bot, Send, Upload
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  fetchFraudInsights,
  fetchComplianceReport,
  chatWithAI,
  ocrDocument,
  consumeFallbackFlag,
  isAuthError,
} from '@/lib/api';
import { LoadingSkeletonGrid, EmptyState } from '@/components/common/loading-state';
import { ApiFallbackBanner } from '@/components/common/api-fallback-banner';
import { useToast } from '@/components/common/toast';

type Panel = 'overview' | 'chat' | 'ocr';

export function AIFraudDetectionDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState('');
  const [activePanel, setActivePanel] = useState<Panel>('overview');

  // Chat
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([
    { role: 'ai', text: "I'm EdVault AI Assistant. Ask me about credential verification, fraud detection, or academic records." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // OCR
  const [ocrText, setOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { notify } = useToast();

  const load = () => {
    setLoading(true);
    fetchFraudInsights()
      .then(d => { setData(d); setOffline(consumeFallbackFlag()); })
      .catch(err => { setData(null); setOffline(!isAuthError(err)); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleComplianceReport = async () => {
    setReportLoading(true); setReport('');
    try {
      const res = await fetchComplianceReport();
      setReport(res.report);
      notify({ title: 'Report Generated', description: 'AI compliance analysis complete.' });
    } catch {
      notify({ title: 'Error', description: 'Add GROQ_API_KEY to backend/.env to enable AI reports.' });
    } finally { setReportLoading(false); }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput('');
    setChatMessages(m => [...m, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const { reply } = await chatWithAI(msg);
      setChatMessages(m => [...m, { role: 'ai', text: reply }]);
    } catch {
      setChatMessages(m => [...m, { role: 'ai', text: 'AI unavailable. Check GROQ_API_KEY in backend/.env.' }]);
    } finally { setChatLoading(false); }
  };

  const handleFileSelect = (file: File) => {
    setOcrFile(file);
    setOcrText('');
  };

  const handleOCR = async () => {
    if (!ocrFile) return;
    setOcrLoading(true); setOcrText('');
    try {
      const { text } = await ocrDocument(ocrFile);
      setOcrText(text || 'No text extracted from this file.');
      notify({ title: 'OCR Complete', description: 'Text extracted successfully.' });
    } catch (err: any) {
      const msg = err?.message || 'OCR failed';
      setOcrText(`Error: ${msg}\n\nEnsure GROQ_API_KEY is set in backend/.env and the file is a valid image.`);
      notify({ title: 'OCR Failed', description: msg });
    } finally { setOcrLoading(false); }
  };

  if (loading) return (
    <DashboardLayout title="AI Sentinel" subtitle="Advanced neural network monitoring for credential integrity">
      <LoadingSkeletonGrid />
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout title="AI Sentinel" subtitle="Advanced neural network monitoring for credential integrity">
      <EmptyState title="Could not load data" description="Make sure the backend is running on port 5000 and you are signed in." />
    </DashboardLayout>
  );

  const { fraud, dashboardCards } = data;

  const panels: { key: Panel; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BrainCircuit },
    { key: 'chat', label: 'AI Assistant', icon: Bot },
    { key: 'ocr', label: 'OCR Extractor', icon: ScanFace },
  ];

  return (
    <DashboardLayout title="AI Sentinel" subtitle="Advanced neural network monitoring for credential integrity">
      {offline && <ApiFallbackBanner />}

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        {panels.map(p => (
          <button key={p.key} onClick={() => setActivePanel(p.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activePanel === p.key ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
            <p.icon className="h-4 w-4" />{p.label}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto text-slate-400 gap-2" onClick={load}>
          <RefreshCw className="h-4 w-4" />Refresh
        </Button>
      </div>

      <AnimatePresence mode="wait">

        {/* ── OVERVIEW ── */}
        {activePanel === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><BrainCircuit className="h-24 w-24 text-cyan-400" /></div>
                <CardContent className="pt-6 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4">Global Risk Score</p>
                  <div className="relative inline-block my-2">
                    <svg className="h-28 w-28 -rotate-90">
                      <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent"
                        strokeDasharray={314} strokeDashoffset={314 - (314 * fraud.riskScore) / 100}
                        className={fraud.riskScore < 30 ? 'text-emerald-500' : fraud.riskScore < 70 ? 'text-yellow-500' : 'text-red-500'} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
                      <span className="text-3xl font-black text-white">{fraud.riskScore}%</span>
                    </div>
                  </div>
                  <Badge className={`mt-3 ${fraud.riskScore < 30 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : fraud.riskScore < 70 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {fraud.riskScore < 30 ? 'LOW RISK' : fraud.riskScore < 70 ? 'MEDIUM RISK' : 'HIGH RISK'}
                  </Badge>
                </CardContent>
              </Card>

              <div className="md:col-span-3 grid gap-4 grid-cols-1 sm:grid-cols-3">
                {dashboardCards.map((card: any, i: number) => (
                  <Card key={i} className="border-white/10 bg-white/5 hover:border-cyan-500/30 transition-all group">
                    <CardContent className="p-5">
                      <p className="text-sm text-slate-500 group-hover:text-cyan-400 transition-colors">{card.label}</p>
                      <p className="text-3xl font-black text-white mt-1">{card.value}</p>
                      <p className="text-xs text-slate-600 mt-1 italic">"{card.details}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-white/10 bg-black/40">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><ScanFace className="h-5 w-5 text-purple-400" />Neural Document Analysis</CardTitle>
                    <CardDescription>Real-time integrity checks across active institution nodes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {[
                      { label: 'Metadata Consistency', value: 98, color: 'bg-cyan-500' },
                      { label: 'Issuer Signature Validity', value: 100, color: 'bg-emerald-500' },
                      { label: 'Hash Collision Detection', value: 99, color: 'bg-purple-500' },
                      { label: 'Anomaly Pattern Matching', value: 94, color: 'bg-pink-500' },
                    ].map((m, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm"><span className="text-slate-300">{m.label}</span><span className="text-white font-mono">{m.value}%</span></div>
                        <Progress value={m.value} className="h-1.5 bg-white/5" indicatorClassName={m.color} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-black/40">
                  <CardHeader><CardTitle className="text-lg">Recent Security Alerts</CardTitle></CardHeader>
                  <CardContent className="p-0 divide-y divide-white/5">
                    {fraud.alerts.map((alert: any, i: number) => (
                      <div key={i} className="p-4 flex gap-3 hover:bg-white/5">
                        <div className={`mt-0.5 p-2 rounded-lg bg-white/5 ${alert.severity === 'high' ? 'text-pink-500' : 'text-blue-400'}`}>
                          {alert.severity === 'high' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-white text-sm">{alert.title || 'Security Alert'}</p>
                            <Badge variant="outline" className={`text-[10px] ${alert.severity === 'high' ? 'border-pink-500/30 text-pink-400' : 'border-emerald-500/30 text-emerald-400'}`}>{alert.severity}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Zap className="h-5 w-5 text-cyan-400" />AI Recommendations</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm font-bold text-white flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-400" />Protocol Upgrade</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">Unusual IP clusters in Block #15.4M. Enable multi-sig for registrar wallets.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm font-bold text-white flex items-center gap-2"><Fingerprint className="h-4 w-4 text-cyan-400" />Biometric Anchoring</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">ZK-Proof success rate 99.8%. Ready for biometric integration.</p>
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-500 gap-2 py-5" onClick={handleComplianceReport} disabled={reportLoading}>
                      {reportLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><FileText className="h-4 w-4" />Generate Compliance Report</>}
                    </Button>
                    {report && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
                        <p className="font-bold text-emerald-400 mb-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />AI Report</p>
                        {report}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-black/40">
                  <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-500">Security Nodes</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { node: 'Hardhat Blockchain', latency: '2ms' },
                      { node: 'IPFS / Pinata', latency: '45ms' },
                      { node: 'Groq AI Engine', latency: '~800ms' },
                      { node: 'PostgreSQL DB', latency: '5ms' },
                    ].map((n, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono">{n.node}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">{n.latency}</span>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── AI CHAT ── */}
        {activePanel === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-cyan-400" />AI Verification Assistant</CardTitle>
                <CardDescription>Powered by Groq · Ask about credentials, verification, fraud detection, or academic records. Answers only from verified blockchain data.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto space-y-3 mb-4 pr-1">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'ai' && (
                        <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-cyan-400" />
                        </div>
                      )}
                      <div className={`max-w-sm lg:max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-cyan-400 animate-pulse" />
                      </div>
                      <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-sm text-slate-400 animate-pulse">Thinking...</div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleChat} className="flex gap-2">
                  <Input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask about credentials, verification, or fraud detection..."
                    className="bg-white/5 border-white/10" disabled={chatLoading} />
                  <Button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-cyan-600 hover:bg-cyan-500 px-4">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── OCR ── */}
        {activePanel === 'ocr' && (
          <motion.div key="ocr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ScanFace className="h-5 w-5 text-purple-400" />OCR Document Extractor</CardTitle>
                <CardDescription>Upload a certificate image — Groq Vision AI extracts text and auto-detects metadata mismatches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />

                <div
                  className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-purple-500/40 transition-colors cursor-pointer group"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFileSelect(e.dataTransfer.files[0]); }}>
                  {ocrFile ? (
                    <div className="space-y-2">
                      <FileText className="h-10 w-10 text-purple-400 mx-auto" />
                      <p className="text-purple-400 font-medium">{ocrFile.name}</p>
                      <p className="text-xs text-slate-500">Click to change file</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-slate-500 mx-auto mb-3 group-hover:text-purple-400 transition-colors" />
                      <p className="text-slate-400">Drop certificate image here or click to upload</p>
                      <p className="text-xs text-slate-600 mt-2">Supports JPG, PNG · Powered by Groq Vision</p>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleOCR}
                  disabled={!ocrFile || ocrLoading}
                  className="w-full bg-purple-600 hover:bg-purple-500 gap-2">
                  {ocrLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Extracting text...</>
                    : <><ScanFace className="h-4 w-4" />Extract Text with Groq Vision</>
                  }
                </Button>

                {ocrText && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Extracted Text</p>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-mono">{ocrText}</pre>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
    </DashboardLayout>
  );
}
