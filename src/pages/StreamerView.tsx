import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { formatCurrency, Currency } from '../types';
import { ArrowLeft, Monitor, Layout, Users, Package, Trophy, DollarSign } from 'lucide-react';

type DisplayLayout = 'current' | 'teams' | 'recent' | 'squads' | 'summary';

export default function StreamerView() {
  const { id } = useParams<{ id: string }>();
  const auction = useStore(s => s.auctions).find(a => a.id === id);
  const teams = useStore(s => s.teams).filter(t => t.auctionId === id);
  const lots = useStore(s => s.lots).filter(l => l.auctionId === id);
  const runs = useStore(s => s.runs).filter(r => r.auctionId === id);
  const purchases = useStore(s => s.purchases).filter(p => p.auctionId === id);
  const [layout, setLayout] = useState<DisplayLayout>('current');

  if (!auction) return null;

  const activeRun = runs.find(r => r.status === 'active') || runs.find(r => r.status === 'paused');
  const currentLot = activeRun?.currentLotId ? lots.find(l => l.id === activeRun.currentLotId) : null;
  const soldLots = lots.filter(l => l.status === 'sold');
  const recentSales = soldLots.slice(-6).reverse();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to={`/auction/${id}/setup`} className="p-2 hover:bg-slate-700 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Monitor className="w-5 h-5 text-purple-400" />
            <span className="font-bold">Streamer Control — {auction.name}</span>
          </div>
          <Link to={`/auction/${id}/projector`} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
            Open Projector →
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Layout Selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'current' as DisplayLayout, label: 'Current Lot', icon: Package },
            { id: 'teams' as DisplayLayout, label: 'Team Purse', icon: DollarSign },
            { id: 'recent' as DisplayLayout, label: 'Recent Sales', icon: Trophy },
            { id: 'squads' as DisplayLayout, label: 'Full Squads', icon: Users },
            { id: 'summary' as DisplayLayout, label: 'Summary', icon: Layout },
          ].map(l => (
            <button
              key={l.id}
              onClick={() => setLayout(l.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                layout === l.id ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <l.icon className="w-4 h-4" /> {l.label}
            </button>
          ))}
        </div>

        {/* Preview Area */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-2">
          <div className="bg-slate-900 rounded-lg p-8 min-h-[400px]">
            {layout === 'current' && (
              <div className="text-center">
                {currentLot ? (
                  <>
                    <p className="text-slate-400 text-sm mb-2">LOT #{currentLot.queuePosition}</p>
                    <h1 className="text-5xl font-bold mb-4">{currentLot.name}</h1>
                    <div className="flex justify-center gap-8 mt-8">
                      <div>
                        <p className="text-slate-400 text-sm">Base Price</p>
                        <p className="text-3xl font-bold">{formatCurrency(currentLot.basePrice, auction.currency)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Current Bid</p>
                        <p className="text-3xl font-bold text-green-400">
                          {activeRun?.currentHighestBid ? formatCurrency(activeRun.currentHighestBid, auction.currency) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Leading</p>
                        <p className="text-3xl font-bold text-blue-400">{activeRun?.currentLeadingTeamName || '—'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-2xl text-slate-400">Waiting for next lot...</p>
                  </div>
                )}
              </div>
            )}

            {layout === 'teams' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Team Purse Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {teams.map(team => (
                    <div key={team.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                        <span className="font-semibold">{team.name}</span>
                      </div>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(team.initialPurse - team.totalSpent, auction.currency)}</p>
                      <p className="text-sm text-slate-400">of {formatCurrency(team.initialPurse, auction.currency)}</p>
                      <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${((team.initialPurse - team.totalSpent) / team.initialPurse) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {layout === 'recent' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Recent Sales</h2>
                {recentSales.length === 0 ? (
                  <p className="text-center text-slate-400 text-xl">No sales yet</p>
                ) : (
                  <div className="grid gap-3">
                    {recentSales.map(lot => (
                      <div key={lot.id} className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3">
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="font-semibold text-lg">{lot.name}</p>
                            <p className="text-sm text-slate-400">→ {lot.winningTeamName}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(lot.finalPrice || 0, auction.currency)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {layout === 'squads' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Full Squads</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {teams.map(team => {
                    const teamPurchases = purchases.filter(p => p.teamId === team.id);
                    return (
                      <div key={team.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                          <span className="font-semibold text-lg">{team.name}</span>
                        </div>
                        {teamPurchases.length === 0 ? (
                          <p className="text-slate-500 text-sm">No purchases yet</p>
                        ) : (
                          <div className="space-y-1">
                            {teamPurchases.map(p => (
                              <div key={p.id} className="flex justify-between text-sm">
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

            {layout === 'summary' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-8">{auction.name}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-4xl font-bold text-green-400">{lots.filter(l => l.status === 'sold').length}</p>
                    <p className="text-slate-400 mt-1">Sold</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-red-400">{lots.filter(l => l.status === 'unsold').length}</p>
                    <p className="text-slate-400 mt-1">Unsold</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-blue-400">{teams.length}</p>
                    <p className="text-slate-400 mt-1">Teams</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-purple-400">{lots.length}</p>
                    <p className="text-slate-400 mt-1">Total Lots</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
