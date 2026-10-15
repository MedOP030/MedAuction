import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Navigate } from 'react-router-dom';
import { Trophy, Users, Shield, Zap, BarChart3, Globe } from 'lucide-react';

export default function Landing() {
  const currentUser = useStore(s => s.currentUser);
  if (currentUser) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">MedAuction</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 text-white/80 hover:text-white transition">Login</Link>
          <Link to="/register" className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-medium transition">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Every Bid.<br />Every Team.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">One Platform.</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          MedAuction is the complete multi-auction management platform for medical colleges, 
          tournaments, sports leagues, and competitive events.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-semibold text-lg transition shadow-lg shadow-teal-500/25">
            Create Free Account
          </Link>
          <Link to="/login" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition backdrop-blur">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Built for Every Auction</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Secure Bidding', desc: 'Server-validated transactions with atomic operations. Every bid is verified against financial rules before acceptance.' },
            { icon: Users, title: 'Multi-Role Access', desc: 'Owners, auctioneers, captains, streamers, and spectators — each with dedicated workspaces and permissions.' },
            { icon: Zap, title: 'Real-Time Updates', desc: 'Live bid tracking, instant SOLD/UNSOLD announcements, and synchronized displays across all participants.' },
            { icon: Trophy, title: 'Complete Lifecycle', desc: 'From draft to completion — practice runs, official auctions, pause/resume, undo, and comprehensive reports.' },
            { icon: BarChart3, title: 'Financial Tracking', desc: 'Automatic purse management, squad limits, spending analytics, and exportable results.' },
            { icon: Globe, title: 'Multi-Event Ready', desc: 'Medical tournaments, sports leagues, charity events — configure any auction type without code changes.' },
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <feature.icon className="w-10 h-10 text-teal-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/10 text-center text-slate-400">
        <p>© 2024 MedAuction. Every Bid. Every Team. One Platform.</p>
      </footer>
    </div>
  );
}
