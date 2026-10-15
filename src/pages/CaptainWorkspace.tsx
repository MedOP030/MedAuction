import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { formatCurrency, getRemainingPurse, getAvailableSlots, getMaxPermittedBid, getMinRequiredSpending, Currency } from '../types';
import {
  ArrowLeft, Gavel, Wallet, Users, Package, AlertCircle,
  CheckCircle, Trophy, TrendingUp
} from 'lucide-react';

export default function CaptainWorkspace() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useStore(s => s.currentUser);
  const auction = useStore(s => s.auctions).find(a => a.id === id);
  const getUserTeam = useStore(s => s.getUserTeam);
  const placeBid = useStore(s => s.placeBid);
  const runs = useStore(s => s.runs).filter(r => r.auctionId === id);
  const bids = useStore(s => s.bids).filter(b => b.auctionId === id);
  const purchases = useStore(s => s.purchases).filter(p => p.auctionId === id);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!auction || !currentUser) return null;

  const teamId = getUserTeam(id!, currentUser.id);
  const team = useStore.getState().teams.find(t => t.id === teamId);
  const activeRun = runs.find(r => r.status === 'active') || runs.find(r => r.status === 'paused');
  const currentLot = activeRun?.currentLotId ? useStore.getState().lots.find(l => l.id === activeRun.currentLotId) : null;
  const recentBids = currentLot ? bids.filter(b => b.lotId === currentLot.id).sort((a, b) => b.sequence - a.sequence) : [];
  const teamPurchases = purchases.filter(p => p.teamId === teamId);

  const remaining = team ? getRemainingPurse(team) : 0;
  const availableSlots = team ? getAvailableSlots(team, auction.settings) : 0;
  const maxBid = team ? getMaxPermittedBid(team, auction.settings) : 0;
  const minRequired = team ? getMinRequiredSpending(team, auction.settings) : 0;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBid = (amount: number) => {
    if (!activeRun || !currentLot || !teamId) return;
    const result = placeBid(activeRun.id, currentLot.id, teamId, amount);
    if (result.success) {
      showNotification('success', `Bid of ${formatCurrency(amount, auction.currency)} placed!`);
    } else {
      showNotification('error', result.error || 'Bid rejected');
    }
  };

  const currentBid = activeRun?.currentHighestBid || 0;
  const basePrice = currentLot?.basePrice || auction.settings.basePrice;
  const minBid = Math.max(currentBid + auction.settings.minIncrement, basePrice + auction.settings.minIncrement);
  const isLeading = activeRun?.currentLeadingTeamId === teamId;

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No Team Assigned</h2>
          <p className="text-slate-500 mb-4">You haven't been assigned to a team in this auction.</p>
          <Link to="/dashboard" className="text-teal-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-medium`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: team.color }} />
              <div>
                <h1 className="font-bold text-slate-800">{team.name}</h1>
                <p className="text-xs text-slate-500">{auction.name}</p>
              </div>
            </div>
          </div>
          {activeRun && (
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
              activeRun.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${activeRun.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              {activeRun.status === 'active' ? 'LIVE' : 'PAUSED'}
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-green-500" />
              <span className="text-xs text-slate-500 uppercase font-medium">Remaining</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(remaining, auction.currency)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-500 uppercase font-medium">Squad</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{team.squadSize}/{auction.settings.maxSquadSize}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-slate-500 uppercase font-medium">Spent</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(team.totalSpent, auction.currency)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-slate-500 uppercase font-medium">Max Next Bid</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(maxBid, auction.currency)}</p>
          </div>
        </div>

        {/* Current Lot */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          {currentLot ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Current Lot #{currentLot.queuePosition}
                </span>
                {isLeading && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Your team is leading
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{currentLot.name}</h2>
              {currentLot.category && <p className="text-slate-500 mb-4">{currentLot.category}</p>}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Base Price</p>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(currentLot.basePrice, auction.currency)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 mb-1">Current Bid</p>
                  <p className="text-lg font-bold text-green-700">
                    {currentBid > 0 ? formatCurrency(currentBid, auction.currency) : 'No bids'}
                  </p>
                  {activeRun?.currentLeadingTeamName && (
                    <p className="text-xs text-green-600">by {activeRun.currentLeadingTeamName}</p>
                  )}
                </div>
              </div>

              {/* Bidding Controls */}
              {!isLeading && activeRun?.status === 'active' && availableSlots > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Place Your Bid</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* Minimum bid button */}
                    <button
                      onClick={() => handleBid(currentBid > 0 ? currentBid + auction.settings.minIncrement : currentLot.basePrice + auction.settings.minIncrement)}
                      disabled={minBid > maxBid}
                      className="px-4 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bid {formatCurrency(currentBid > 0 ? currentBid + auction.settings.minIncrement : currentLot.basePrice + auction.settings.minIncrement, auction.currency)}
                    </button>
                    {/* Quick bid buttons */}
                    {auction.settings.quickBidIncrements.map(inc => {
                      const bidAmount = (currentBid || currentLot.basePrice) + inc;
                      return (
                        <button
                          key={inc}
                          onClick={() => handleBid(bidAmount)}
                          disabled={bidAmount > maxBid}
                          className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +{formatCurrency(inc, auction.currency)}
                        </button>
                      );
                    })}
                  </div>
                  {minBid > maxBid && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Insufficient purse to place minimum bid while completing squad requirements.
                    </p>
                  )}
                </div>
              )}

              {isLeading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your team is already leading. Another team must outbid you.
                </div>
              )}

              {activeRun?.status === 'paused' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Auction is currently paused. Bidding will resume shortly.
                </div>
              )}

              {availableSlots === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your squad is full. No more purchases allowed.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {activeRun ? 'Waiting for next lot...' : 'Auction has not started yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Recent Bids */}
        {recentBids.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Bid History (Current Lot)</h3>
            <div className="space-y-2">
              {recentBids.map((bid, i) => (
                <div key={bid.id} className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${
                  i === 0 ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
                }`}>
                  <span className="font-medium text-slate-700">{bid.teamName}</span>
                  <span className={`font-bold ${i === 0 ? 'text-green-600' : 'text-slate-600'}`}>
                    {formatCurrency(bid.amount, auction.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Purchases */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Your Purchases ({teamPurchases.length})</h3>
          {teamPurchases.length === 0 ? (
            <p className="text-slate-400 text-sm">No purchases yet</p>
          ) : (
            <div className="space-y-2">
              {teamPurchases.map(p => (
                <div key={p.id} className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <span className="text-slate-700">{p.lotName}</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(p.price, auction.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Squad Info */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Squad Requirements</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Min squad size:</span>
              <span className="font-medium text-slate-700">{auction.settings.minSquadSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Max squad size:</span>
              <span className="font-medium text-slate-700">{auction.settings.maxSquadSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Slots available:</span>
              <span className="font-medium text-slate-700">{availableSlots}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Min required spending:</span>
              <span className="font-medium text-slate-700">{formatCurrency(minRequired, auction.currency)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
