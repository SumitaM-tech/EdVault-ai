import { ArrowRight, BadgeCheck, Brain, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FloatingParticle = ({ delay, duration }: { delay: number; duration: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-cyan-500 rounded-full"
    animate={{ y: [0, -100, 0], x: [0, 50, 0], opacity: [0, 1, 0] }}
    transition={{ delay, duration, repeat: Infinity }}
    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
  />
);

export function LandingPage() {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Blockchain Security',
      description: 'Immutable issuance and instant provenance checks across the credential lifecycle.',
      color: 'text-cyan-500',
    },
    {
      icon: Brain,
      title: 'AI Fraud Detection',
      description: 'Flags suspicious uploads, metadata mismatch, and duplicate records before they spread.',
      color: 'text-purple-500',
    },
    {
      icon: QrCode,
      title: 'QR Verification',
      description: 'Fast recruiter verification through secure QR payloads tied to on-chain identity.',
      color: 'text-pink-500',
    },
    {
      icon: BadgeCheck,
      title: 'Career Passport',
      description: 'Students carry a portable, trusted record of education and achievement.',
      color: 'text-neon-green',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.1} duration={4 + Math.random() * 2} />
        ))}
      </div>

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-3xl border border-cyan-500/30 bg-slate-900/40 backdrop-blur-xl px-5 py-4 glass"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/80 font-semibold">EdVault AI</p>
            <p className="mt-1 text-sm text-slate-400">Enterprise Credential Infrastructure</p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost">Product</Button>
            <Button variant="ghost">Security</Button>
            <Link to="/admin">
              <Button className="bg-cyan-500/20 border border-cyan-500/50 hover:bg-cyan-500/30">
                Launch App <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="grid gap-12 py-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 w-fit"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-medium">Powered by Blockchain & AI</span>
            </motion.div>

            {/* Main Heading */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="block text-white">Trust Academic</span>
                <span className="block gradient-text">Credentials Instantly</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl">
                Immutable blockchain records with intelligent fraud detection. Verification that's both instant and trustworthy.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <Link to="/admin">
                <Button
                  size="lg"
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold shadow-lg shadow-cyan-500/50"
                >
                  Get Started <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-cyan-500/30 hover:bg-cyan-500/10">
                View Security Model
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid gap-4 pt-8 border-t border-cyan-500/20">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                <div>
                  <p className="text-3xl font-bold text-cyan-400">99.98%</p>
                  <p className="text-sm text-slate-500">Match Confidence</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-400">0ms</p>
                  <p className="text-sm text-slate-500">Verification Time</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-pink-400">∞</p>
                  <p className="text-sm text-slate-500">Data Immutability</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <Card className="relative overflow-hidden border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl glass">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/5" />
              <CardContent className="relative p-8 space-y-6">
                {/* Verification Flow */}
                <motion.div
                  className="space-y-4"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  {['Credential Submitted', 'AI Analysis Complete', 'Blockchain Verified'].map((step, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg border border-cyan-500/20 bg-slate-800/40"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 + 0.5 }}
                    >
                      <div className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-neon-green' : 'bg-cyan-500'} animate-pulse`} />
                      <span className="text-sm text-slate-300">{step}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Stats Box */}
                <motion.div
                  className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4 glow-purple"
                  animate={{ boxShadow: ['0 0 20px rgba(139, 92, 246, 0.2)', '0 0 30px rgba(139, 92, 246, 0.4)', '0 0 20px rgba(139, 92, 246, 0.2)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <p className="text-xs text-purple-400/70 mb-2">VERIFICATION METRICS</p>
                  <p className="text-2xl font-bold text-white">342,891</p>
                  <p className="text-xs text-slate-500">Credentials Verified</p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Enterprise-Grade <span className="gradient-text">Verification</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Combining blockchain immutability, AI intelligence, and quantum-resistant infrastructure
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="group"
                  whileHover={{ y: -5 }}
                >
                  <Card className="relative overflow-hidden border-cyan-500/20 bg-slate-900/40 backdrop-blur-xl h-full transition-all duration-300 hover:border-cyan-500/50 glass">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/5 transition-all duration-300" />
                    <CardContent className="relative p-6 space-y-4">
                      <div className={`w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/50 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300 ${feature.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{feature.title}</h3>
                        <p className="text-sm text-slate-400 mt-2">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* CTA Section */}
        <motion.section
          className="py-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-xl p-12 md:p-16 text-center overflow-hidden glass">
            <div className="absolute inset-0 cyber-grid opacity-5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Credential Verification?</h2>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                Join universities and enterprises revolutionizing academic credentialing with blockchain technology
              </p>
              <Link to="/admin">
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold shadow-lg shadow-cyan-500/50">
                  Start Your Free Trial <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
