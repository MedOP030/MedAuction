import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { formatCurrency, Currency } from '../types';
import { Trophy, X, Maximize2 } from 'lucide-react';

type ProjectorLayout = 'current' | 'teams' | 'recent' | 'squads' | 'results';

export default function ProjectorView() {
  const { id } = useParams<{ id: string }>();
  const auction = useStore(s => s.auctions).find(a => a.id === id);
  const teams = useStore(s => s.teams).filter(t => t.auctionId === id);
  const lots = useStore(s => s.lots).filter(l => l.auctionId === id);
  const runs = useStore(s => s.runs).filter(r => r.auctionId === id);
  const purchases = useStore(s => s.purchases).filter(p => p.auctionId === id);
  const [layout, setLayout] = useState<ProjectorLayout>('current');
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!auction) return null;

  const activeRun = runs.find(r => r.status === 'active') || runs.find(r => r.status === 'paused');
  const currentLot = activeRun?.currentLotId ? lots.find(l => l.id === activeRun.currentLotId) : null;
  const soldLots = lots.filter(l => l.status === 'sold');
  const recentSales = soldLots.slice(-6).reverse();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 opacity-30 hover:opacity-100 transition">
        <button onClick={toggleFullscreen} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
          <Maximize2 className="w-5 h-5" />
        </button>
        <Link to={`/auction/${id}/streamer`} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
          <X className="w-5 h-5" />
        </Link>
      </div>

      {/* Layout Switcher (bottom) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 opacity-20 hover:opacity-100 transition">
        {(['current', 'teams', 'recent', 'squads', 'results'] as ProjectorLayout[]).map(l => (
          <button
            key={l}
            onClick={() => setLayout(l)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              layout === l ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-screen flex items-center justify-center p-8">
        {layout === 'current' && (
          <div className="text-center w-full">
            {currentLot ? (
              <>
                <div className="mb-4">
                  <span className="inline-block px-4 py-1 bg-green-500/20 text-green-400 rounded-full text-lg">
                    LOT #{currentLot.queuePosition}
                  </span>
                </div>
                <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight">{currentLot.name}</h1>
                {currentLot.category && <p className="text-2xl text-slate-400 mb-12">{currentLot.category}</p>}
                <div className="flex justify-center gap-12 md:gap-20">
                  <div>
                    <p className="text-slate-500 text-lg mb-2">BASE PRICE</p>
                    <p className="text-4xl md:text-5xl font-bold">{formatCurrency(currentLot.basePrice, auction.currency)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-lg mb-2">CURRENT BID</p>
                    <p className="text-4xl md:text-5xl font-bold text-green-400">
                      {activeRun?.currentHighestBid ? formatCurrency(activeRun.currentHighestBid, auction.currency) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-lg mb-2">LEADING</p>
                    <p className="text-4xl md:text-5xl font-bold text-blue-400">
                      {activeRun?.currentLeadingTeamName || '—'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <Trophy className="w-24 h-24 text-slate-700 mx-auto mb-6" />
                <p className="text-4xl text-slate-500">
                  {activeRun ? 'Waiting for next lot...' : 'Auction has not started'}
                </p>
              </div>
            )}
          </div>
        )}

        {layout === 'teams' && (
          <div className="w-full max-w-5xl">
            <h1 className="text-4xl font-bold text-center mb-12">Team Purse Overview</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {teams.map(team => {
                const remaining = team.initialPurse - team.totalSpent;
                const pct = (remaining / team.initialPurse) * 100;
                return (
                  <div key={team.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="text-xl font-bold">{team.name}</span>
                    </div>
                    <p className="text-4xl font-bold text-green-400 mb-1">{formatCurrency(remaining, auction.currency)}</p>
                    <p className="text-slate-500">of {formatCurrency(team.initialPurse, auction.currency)}</p>
                    <div className="mt-3 h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: team.color }} />
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{team.squadSize} purchases</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {layout === 'recent' && (
          <div className="w-full max-w-4xl">
            <h1 className="text-4xl font-bold text-center mb-12">Recent Sales</h1>
            {recentSales.length === 0 ? (
              <p className="text-3xl text-slate-500 text-center">No sales yet</p>
            ) : (
              <div className="space-y-4">
                {recentSales.map((lot, i) => (
                  <div key={lot.id} className="flex items-center justify-between bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-4">
                      <Trophy className="w-8 h-8 text-yellow-400" />
                      <div>
                        <p className="text-2xl font-bold">{lot.name}</p>
                        <p className="text-lg text-slate-400">→ {lot.winningTeamName}</p>
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-green-400">{formatCurrency(lot.finalPrice || 0, auction.currency)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {layout === 'squads' && (
          <div className="w-full max-w-5xl">
            <h1 className="text-4xl font-bold text-center mb-12">Full Squads</h1>
            <div className="grid md:grid-cols-2 gap-6">
              {teams.map(team => {
                const teamPurchases = purchases.filter(p => p.teamId === team.id);
                return (
                  <div key={team.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="text-2xl font-bold">{team.name}</span>
                    </div>
                    {teamPurchases.length === 0 ? (
                      <p className="text-slate-500 text-lg">No purchases yet</p>
                    ) : (
                      <div className="space-y-2">
                        {teamPurchases.map(p => (
                          <div key={p.id} className="flex justify-between text-lg">
                            <span className="text-slate-300">{p.lotName}</span>
                            <span className="text-slate-400">{formatCurrency(p.price, auction.currency)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {layout === 'results' && (
          <div className="text-center w-full">
            <h1 className="text-5xl font-bold mb-12">{auction.name}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div>
                <p className="text-6xl font-bold text-green-400">{soldLots.length}</p>
                <p className="text-xl text-slate-400 mt-2">Sold</p>
              </div>
              <div>
                <p className="text-6xl font-bold text-red-400">{lots.filter(l => l.status === 'unsold').length}</p>
                <p className="text-xl text-slate-400 mt-2">Unsold</p>
              </div>
              <div>
                <p className="text-6xl font-bold text-blue-400">{teams.length}</p>
                <p className="text-xl text-slate-400 mt-2">Teams</p>
              </div>
              <div>
                <p className="text-6xl font-bold text-purple-400">{lots.length}</p>
                <p className="text-xl text-slate-400 mt-2">Total Lots</p>
              </div>
            </div>
            <div className="text-3xl text-slate-300">
              Total Spending: <span className="text-green-400 font-bold">{formatCurrency(purchases.reduce((s, p) => s + p.price, 0), auction.currency)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Auction Branding */}
      <div className="absolute bottom-4 left-4 text-slate-600 text-sm">
        MedAuction — {auction.name}
      </div>
    </div>
  );
}
