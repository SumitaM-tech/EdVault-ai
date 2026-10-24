import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Activity, ExternalLink, Database, Shield, Cpu, Globe, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeletonGrid } from '@/components/common/loading-state';
import { fetchLedgerCredentials, consumeFallbackFlag } from '@/lib/api';
import { ApiFallbackBanner } from '@/components/common/api-fallback-banner';

export function BlockchainExplorerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = () => {
    setLoading(true);
    fetchLedgerCredentials()
      .then(creds => {
        setTransactions(creds.map((c: any) => ({
          id: c.id,
          title: c.title,
          institution: c.institution,
          blockchainTx: c.blockchainTx,
          studentName: c.studentName ?? 'Unknown',
          blockNumber: c.blockNumber ?? 15420000,
          status: c.status,
          issuedAt: c.issuedAt,
        })));
        setOffline(consumeFallbackFlag());
      })
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Filter works on name, tx hash, credential ID, institution
  const filtered = transactions.filter(tx =>
    !searchTerm ||
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.blockchainTx.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Network Status', value: 'Operational', icon: Globe, color: 'text-emerald-400' },
    { label: 'Avg Block Time', value: '12.4s', icon: Cpu, color: 'text-cyan-400' },
    { label: 'Total Verified', value: transactions.length, icon: Shield, color: 'text-purple-400' },
    { label: 'IPFS Shards', value: transactions.length, icon: Database, color: 'text-pink-400' },
  ];

  if (loading) return <DashboardLayout title="Ledger Explorer" subtitle="Cryptographically verify every institutional record on-chain"><LoadingSkeletonGrid /></DashboardLayout>;

  return (
    <DashboardLayout title="Ledger Explorer" subtitle="Cryptographically verify every institutional record on-chain">
      {offline && <ApiFallbackBanner />}

      <div className="space-y-6">
        {/* Search + Refresh */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by student name, credential ID, tx hash, institution..."
              className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl"
            />
          </div>
          <Button variant="ghost" className="h-12 gap-2 text-slate-400 hover:text-white border border-white/10" onClick={load}>
            <RefreshCw className="h-4 w-4" />Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={`h-8 w-8 ${s.color}`} />
                  <div>
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="text-lg font-bold text-white">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Table */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />Recent Verified Blocks
              </CardTitle>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 animate-pulse text-xs">Live Feed</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
                {transactions.length === 0
                  ? <p>No credentials issued yet. Issue a credential from the Admin panel to see it here.</p>
                  : <p>No results match "<span className="text-slate-400">{searchTerm}</span>"</p>
                }
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-slate-500">Block</TableHead>
                    <TableHead className="text-slate-500">Transaction Hash</TableHead>
                    <TableHead className="text-slate-500">Student</TableHead>
                    <TableHead className="text-slate-500">Credential</TableHead>
                    <TableHead className="text-slate-500">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tx, i) => (
                    <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-white/5 hover:bg-white/5 group">
                      <TableCell className="font-mono text-xs text-slate-500">#{tx.blockNumber}</TableCell>
                      <TableCell>
                        <p className="font-mono text-xs text-cyan-400 truncate max-w-[140px]">{tx.blockchainTx.slice(0, 18)}...</p>
                      </TableCell>
                      <TableCell className="text-white text-sm">{tx.studentName}</TableCell>
                      <TableCell>
                        <Link to={`/credential/${tx.id}`} className="font-mono text-xs text-purple-400 hover:text-purple-300 hover:underline group-hover:text-purple-300">
                          {tx.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${tx.status === 'Verified' || tx.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : tx.status === 'Revoked' || tx.status === 'REVOKED' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
