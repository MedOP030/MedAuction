import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { formatCurrency, Currency } from '../types';
import { Trophy, Users, Package, Radio, Lock } from 'lucide-react';

export default function SpectatorView() {
  const { id } = useParams<{ id: string }>();
  const auction = useStore(s => s.auctions).find(a => a.id === id);
  const teams = useStore(s => s.teams).filter(t => t.auctionId === id);
  const lots = useStore(s => s.lots).filter(l => l.auctionId === id);
  const runs = useStore(s => s.runs).filter(r => r.auctionId === id);
  const purchases = useStore(s => s.purchases).filter(p => p.auctionId === id);

  if (!auction) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Auction Not Found</h2>
          <p className="text-slate-500">This auction may be private or no longer available.</p>
        </div>
      </div>
    );
  }

  const activeRun = runs.find(r => r.status === 'active') || runs.find(r => r.status === 'paused');
  const currentLot = activeRun?.currentLotId ? lots.find(l => l.id === activeRun.currentLotId) : null;
  const soldLots = lots.filter(l => l.status === 'sold');
  const unsoldLots = lots.filter(l => l.status === 'unsold');
  const recentSales = soldLots.slice(-8).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{auction.name}</h1>
              <p className="text-sm text-slate-300">{auction.category}</p>
            </div>
          </div>
          {activeRun && (
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
              activeRun.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${activeRun.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              {activeRun.status === 'active' ? 'LIVE' : 'PAUSED'}
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Current Lot */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 mb-8">
          {currentLot ? (
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-2">NOW BIDDING — LOT #{currentLot.queuePosition}</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{currentLot.name}</h2>
              <div className="flex justify-center gap-8 md:gap-16">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Base Price</p>
                  <p className="text-2xl md:text-3xl font-bold">{formatCurrency(currentLot.basePrice, auction.currency)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Current Bid</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-400">
                    {activeRun?.currentHighestBid ? formatCurrency(activeRun.currentHighestBid, auction.currency) : 'No bids yet'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Leading Team</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-400">
                    {activeRun?.currentLeadingTeamName || '—'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-2xl text-slate-400">
                {activeRun ? 'Waiting for next lot...' : 'Auction has not started yet'}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{soldLots.length}</p>
            <p className="text-slate-400 text-sm">Sold</p>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{unsoldLots.length}</p>
            <p className="text-slate-400 text-sm">Unsold</p>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{teams.length}</p>
            <p className="text-slate-400 text-sm">Teams</p>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-400">{lots.length}</p>
            <p className="text-slate-400 text-sm">Total Lots</p>
          </div>
        </div>

        {/* Teams */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Teams
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {teams.map(team => (
              <div key={team.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: team.color }} />
                <div className="flex-1">
                  <p className="font-semibold">{team.name}</p>
                  <p className="text-sm text-slate-400">{team.squadSize} purchases • {formatCurrency(team.initialPurse - team.totalSpent, auction.currency)} remaining</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        {recentSales.length > 0 && (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" /> Recent Sales
            </h3>
            <div className="space-y-2">
              {recentSales.map(lot => (
                <div key={lot.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <div>
                      <p className="font-semibold">{lot.name}</p>
                      <p className="text-sm text-slate-400">→ {lot.winningTeamName}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(lot.finalPrice || 0, auction.currency)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 text-center text-slate-500 text-sm">
        <p>MedAuction — Every Bid. Every Team. One Platform.</p>
      </footer>
    </div>
  );
}
