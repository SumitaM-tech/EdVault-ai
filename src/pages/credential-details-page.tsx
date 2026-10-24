import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck, 
  Database, 
  Link as LinkIcon, 
  History,
  User,
  School,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchCredentialDetails, consumeFallbackFlag } from '@/lib/api';
import { LoadingSkeletonGrid, EmptyState } from '@/components/common/loading-state';
import { ApiFallbackBanner } from '@/components/common/api-fallback-banner';

export function CredentialDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCredentialDetails(id)
      .then((details) => {
        setData(details);
        setOffline(consumeFallbackFlag());
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Credential Intelligence" subtitle={`Detailed analysis for record ${id}`}>
        <LoadingSkeletonGrid />
      </DashboardLayout>
    );
  }

  if (!data?.credential) {
    return (
      <DashboardLayout title="Credential Intelligence" subtitle={`Detailed analysis for record ${id}`}>
        <EmptyState title="Credential not found" description="No record exists for this ID, or the API is unavailable." />
      </DashboardLayout>
    );
  }

  const { credential, timeline, student } = data;

  return (
    <DashboardLayout title="Credential Intelligence" subtitle={`Detailed analysis for record ${id}`}>
      <div className="space-y-6">
        {offline && <ApiFallbackBanner />}
        <Link to="/student">
          <Button variant="ghost" className="text-slate-400 hover:text-white mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Passport
          </Button>
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-white">{credential.title}</CardTitle>
                  <p className="text-slate-400 flex items-center gap-2">
                    <School className="h-4 w-4" /> {credential.institution}
                  </p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
                  Verified Active
                </Badge>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Credential Metadata</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Issued On</span>
                        <span className="text-white">{new Date(credential.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Department</span>
                        <span className="text-white">Computer Science</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Grade Points</span>
                        <span className="text-white">3.95 / 4.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Issuer Wallet</span>
                        <span className="text-cyan-400 font-mono">0x821...39f2</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Student Profile</h4>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <img src={student.avatar} className="h-12 w-12 rounded-lg bg-slate-800" alt="" />
                      <div>
                        <p className="text-white font-bold">{student.name}</p>
                        <p className="text-xs text-slate-500">ID: {student.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-400" />
                  Technical Evidence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-mono">Blockchain Transaction (EVM)</label>
                  <div className="p-3 rounded bg-white/5 border border-white/5 flex items-center justify-between group">
                    <span className="text-sm font-mono text-slate-300 break-all">{credential.blockchainTx}</span>
                    <Button variant="ghost" size="icon" className="text-slate-500 group-hover:text-cyan-400">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-mono">IPFS Content Identifier (CID)</label>
                  <div className="p-3 rounded bg-white/5 border border-white/5 flex items-center justify-between group">
                    <span className="text-sm font-mono text-slate-300 break-all">{credential.cid}</span>
                    <Button variant="ghost" size="icon" className="text-slate-500 group-hover:text-purple-400">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-mono">Document Integrity Hash (SHA-256)</label>
                  <div className="p-3 rounded bg-white/5 border border-white/5">
                    <span className="text-sm font-mono text-slate-300 break-all">{credential.hash}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lifecycle Timeline */}
          <div className="space-y-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-pink-400" />
                  Lifecycle Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="relative pt-4">
                <div className="absolute left-9 top-8 bottom-8 w-0.5 bg-white/10" />
                <div className="space-y-12 relative">
                  {timeline.map((event: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className="flex gap-6"
                    >
                      <div className={`z-10 h-6 w-6 rounded-full border-4 border-black shrink-0 mt-1 ${
                        event.tone === 'success' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-700'
                      }`} />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          {event.title}
                          {event.tone === 'success' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                        <p className="text-[10px] text-slate-600 font-mono pt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
