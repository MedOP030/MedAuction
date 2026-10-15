import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatCurrency, Currency, Lot, Team } from '../types';
import {
  ArrowLeft, Play, Pause, SkipForward, CheckCircle, XCircle,
  Undo2, Plus, AlertTriangle, Radio, Users, Package, Clock,
  Gavel, ChevronRight, Settings
} from 'lucide-react';

export default function AuctioneerWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useStore(s => s.currentUser);
  const auction = useStore(s => s.auctions).find(a => a.id === id);
  const teams = useStore(s => s.teams).filter(t => t.auctionId === id);
  const lots = useStore(s => s.lots).filter(l => l.auctionId === id).sort((a, b) => a.queuePosition - b.queuePosition);
  const runs = useStore(s => s.runs).filter(r => r.auctionId === id);
  const bids = useStore(s => s.bids).filter(b => b.auctionId === id);
  const createRun = useStore(s => s.createRun);
  const startRun = useStore(s => s.startRun);
  const pauseRun = useStore(s => s.pauseRun);
  const resumeRun = useStore(s => s.resumeRun);
  const startNextLot = useStore(s => s.startNextLot);
  const skipLot = useStore(s => s.skipLot);
  const markSold = useStore(s => s.markSold);
  const markUnsold = useStore(s => s.markUnsold);
  const undoLastSale = useStore(s => s.undoLastSale);
  const placeBid = useStore(s => s.placeBid);
  const changeAuctionStatus = useStore(s => s.changeAuctionStatus);

  const [manualBidTeam, setManualBidTeam] = useState('');
  const [manualBidAmount, setManualBidAmount] = useState(0);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeRun = runs.find(r => r.status === 'active') || runs.find(r => r.status === 'paused');
  const currentLot = activeRun?.currentLotId ? lots.find(l => l.id === activeRun.currentLotId) : null;
  const recentBids = bids.filter(b => b.lotId === currentLot?.id).sort((a, b) => b.sequence - a.sequence).slice(0, 10);
  const pendingLots = lots.filter(l => l.status === 'pending');
  const soldLots = lots.filter(l => l.status === 'sold');
  const unsoldLots = lots.filter(l => l.status === 'unsold');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartRun = () => {
    if (!id) return;
    const run = createRun(id, 'official');
    startRun(run.id);
    changeAuctionStatus(id, 'live');
    showNotification('success', 'Auction run started!');
  };

  const handleManualBid = () => {
    if (!activeRun || !currentLot || !manualBidTeam) return;
    const result = placeBid(activeRun.id, currentLot.id, manualBidTeam, manualBidAmount);
    if (result.success) {
      showNotification('success', `Bid of ${formatCurrency(manualBidAmount, auction?.currency)} placed!`);
      setManualBidAmount(0);
    } else {
      showNotification('error', result.error || 'Bid rejected');
    }
  };

  const handleSold = () => {
    if (!activeRun) return;
    if (!activeRun.currentLeadingTeamId) {
      showNotification('error', 'No bids placed. Cannot mark as SOLD.');
      return;
    }
    setShowConfirm('sold');
  };

  const confirmSold = () => {
    if (!activeRun) return;
    markSold(activeRun.id);
    setShowConfirm(null);
    showNotification('success', 'Lot SOLD!');
  };

  const handleUnsold = () => {
    if (!activeRun) return;
    markUnsold(activeRun.id);
    showNotification('success', 'Lot marked UNSOLD');
  };

  const handleUndo = () => {
    if (!activeRun) return;
    setShowConfirm('undo');
  };

  const confirmUndo = () => {
    if (!activeRun) return;
    undoLastSale(activeRun.id);
    setShowConfirm(null);
    showNotification('success', 'Last sale undone');
  };

  if (!auction || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Auction not found</p>
          <Link to="/dashboard" className="text-teal-600 hover:underline mt-2 inline-block">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-medium animate-pulse`}>
          {notification.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-800">Confirm Action</h3>
            </div>
            <p className="text-slate-600 mb-6">
              {showConfirm === 'sold' && 'Mark this lot as SOLD? This will deduct the amount from the winning team\'s purse.'}
              {showConfirm === 'undo' && 'Undo the last sale? Financial records will be restored.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirm(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">Cancel</button>
              <button
                onClick={showConfirm === 'sold' ? confirmSold : confirmUndo}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to={`/auction/${id}/setup`} className="p-2 hover:bg-slate-700 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-lg">{auction.name}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="capitalize">{auction.mode} Mode</span>
                {activeRun && (
                  <span className={`flex items-center gap-1 ${activeRun.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${activeRun.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                    {activeRun.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/auction/${id}/projector`} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
              Projector
            </Link>
            <Link to={`/auction/${id}/reports`} className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition">
              Reports
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!activeRun ? (
          /* No active run */
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <Radio className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Active Run</h2>
            <p className="text-slate-400 mb-6">Start an official or practice run to begin the auction.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleStartRun} className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition">
                Start Official Run
              </button>
              <button onClick={() => { if (id) { const r = createRun(id, 'practice'); startRun(r.id); } }} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition">
                Start Practice Run
              </button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Panel - Current Lot */}
            <div className="lg:col-span-2 space-y-4">
              {/* Current Lot Card */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                {currentLot ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> LIVE
                      </span>
                      <span className="text-slate-400 text-sm">Lot #{currentLot.queuePosition}</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{currentLot.name}</h2>
                    {currentLot.category && <p className="text-slate-400 mb-4">{currentLot.category}</p>}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Base Price</p>
                        <p className="text-xl font-bold">{formatCurrency(currentLot.basePrice, auction.currency)}</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Current Bid</p>
                        <p className="text-xl font-bold text-green-400">
                          {activeRun.currentHighestBid > 0 ? formatCurrency(activeRun.currentHighestBid, auction.currency) : '—'}
                        </p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Leading Team</p>
                        <p className="text-xl font-bold text-blue-400">
                          {activeRun.currentLeadingTeamName || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Manual Bid Entry */}
                    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <h3 className="text-sm font-medium text-slate-300 mb-3">Manual Bid Entry</h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={manualBidTeam}
                          onChange={e => setManualBidTeam(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="">Select team...</option>
                          {teams.filter(t => t.id !== activeRun.currentLeadingTeamId).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={manualBidAmount || ''}
                          onChange={e => setManualBidAmount(Number(e.target.value))}
                          className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                          placeholder="Amount"
                        />
                        <button
                          onClick={handleManualBid}
                          disabled={!manualBidTeam || !manualBidAmount}
                          className="px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Place Bid
                        </button>
                      </div>
                      {/* Quick bid buttons */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {auction.settings.quickBidIncrements.map(inc => (
                          <button
                            key={inc}
                            onClick={() => setManualBidAmount((activeRun.currentHighestBid || currentLot.basePrice) + inc)}
                            className="px-3 py-1.5 bg-slate-600 text-slate-200 rounded-lg text-sm hover:bg-slate-500 transition"
                          >
                            +{formatCurrency(inc, auction.currency)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 mb-4">No active lot. Start the next lot to continue.</p>
                    <button
                      onClick={() => startNextLot(activeRun.id)}
                      disabled={pendingLots.length === 0}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 inline mr-2" />
                      Start Next Lot
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => currentLot ? startNextLot(activeRun.id) : startNextLot(activeRun.id)}
                  className="flex flex-col items-center gap-1 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition"
                >
                  <SkipForward className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-slate-300">Next Lot</span>
                </button>
                <button
                  onClick={() => currentLot && skipLot(activeRun.id)}
                  disabled={!currentLot}
                  className="flex flex-col items-center gap-1 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition disabled:opacity-50"
                >
                  <SkipForward className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs text-slate-300">Skip</span>
                </button>
                <button
                  onClick={handleSold}
                  disabled={!currentLot}
                  className="flex flex-col items-center gap-1 p-3 bg-green-500/20 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-300">SOLD</span>
                </button>
                <button
                  onClick={handleUnsold}
                  disabled={!currentLot}
                  className="flex flex-col items-center gap-1 p-3 bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-xs text-red-300">UNSOLD</span>
                </button>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => activeRun.status === 'active' ? pauseRun(activeRun.id) : resumeRun(activeRun.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    activeRun.status === 'active' ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                  }`}
                >
                  {activeRun.status === 'active' ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
                </button>
                <button
                  onClick={handleUndo}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg font-medium hover:bg-orange-500/30 transition"
                >
                  <Undo2 className="w-4 h-4" /> Undo Last Sale
                </button>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-4">
              {/* Stats */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Run Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{activeRun.soldCount}</p>
                    <p className="text-xs text-green-300/70">Sold</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-400">{activeRun.unsoldCount}</p>
                    <p className="text-xs text-red-300/70">Unsold</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{activeRun.skippedCount}</p>
                    <p className="text-xs text-yellow-300/70">Skipped</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">{pendingLots.length}</p>
                    <p className="text-xs text-blue-300/70">Remaining</p>
                  </div>
                </div>
              </div>

              {/* Bid History */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Recent Bids</h3>
                {recentBids.length === 0 ? (
                  <p className="text-slate-500 text-sm">No bids yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recentBids.map(bid => (
                      <div key={bid.id} className="flex justify-between items-center text-sm bg-slate-700/30 rounded-lg px-3 py-2">
                        <span className="text-slate-300">{bid.teamName}</span>
                        <span className="font-semibold text-green-400">{formatCurrency(bid.amount, auction.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Lots */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Upcoming Lots</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingLots.slice(0, 5).map((lot, i) => (
                    <div key={lot.id} className="flex justify-between items-center text-sm bg-slate-700/30 rounded-lg px-3 py-2">
                      <span className="text-slate-300">{lot.name}</span>
                      <span className="text-slate-400">{formatCurrency(lot.basePrice, auction.currency)}</span>
                    </div>
                  ))}
                  {pendingLots.length === 0 && <p className="text-slate-500 text-sm">No more lots</p>}
                </div>
              </div>

              {/* Teams Summary */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Teams</h3>
                <div className="space-y-2">
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center gap-2 text-sm bg-slate-700/30 rounded-lg px-3 py-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="flex-1 text-slate-300">{team.name}</span>
                      <span className="text-slate-400">{formatCurrency(team.initialPurse - team.totalSpent, auction.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
