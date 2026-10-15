import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Auction, AuctionStatus, formatCurrency, CURRENCY_SYMBOLS } from '../types';
import {
  Trophy, Plus, LogOut, Search, Filter, Calendar, Users, Hash,
  ChevronRight, Settings, Eye, Radio, CheckCircle, Clock, Archive, Sparkles, Link2
} from 'lucide-react';

export default function Dashboard() {
  const currentUser = useStore(s => s.currentUser);
  const auctions = useStore(s => s.auctions);
  const memberships = useStore(s => s.memberships);
  const teams = useStore(s => s.teams);
  const runs = useStore(s => s.runs);
  const logout = useStore(s => s.logout);
  const seedDemoData = useStore(s => s.seedDemoData);
  const acceptInvitation = useStore(s => s.acceptInvitation);
  const invitations = useStore(s => s.invitations);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [joinToken, setJoinToken] = useState('');
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!currentUser) return null;

  const userAuctions = auctions.filter(a =>
    memberships.some(m => m.auctionId === a.id && m.userId === currentUser.id)
  );

  const filteredAuctions = userAuctions.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getUserRole = (auctionId: string) => {
    return memberships.find(m => m.auctionId === auctionId && m.userId === currentUser.id)?.role;
  };

  const getAuctionTeamCount = (auctionId: string) => teams.filter(t => t.auctionId === auctionId).length;
  const getAuctionLotCount = (auctionId: string) => auctions.find(a => a.id === auctionId) ?
    useStore.getState().lots.filter(l => l.auctionId === auctionId).length : 0;

  const statusColors: Record<AuctionStatus, string> = {
    draft: 'bg-slate-100 text-slate-700',
    upcoming: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-purple-100 text-purple-700',
    archived: 'bg-gray-100 text-gray-500',
  };

  const statusIcons: Record<AuctionStatus, any> = {
    draft: Clock, upcoming: Calendar, live: Radio, paused: Clock,
    completed: CheckCircle, archived: Archive,
  };

  const stats = {
    total: userAuctions.length,
    live: userAuctions.filter(a => a.status === 'live').length,
    upcoming: userAuctions.filter(a => a.status === 'upcoming').length,
    completed: userAuctions.filter(a => a.status === 'completed').length,
    draft: userAuctions.filter(a => a.status === 'draft').length,
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleJoinAuction = () => {
    if (!joinToken.trim()) {
      setJoinMessage({ type: 'error', text: 'Please enter an invite link or token.' });
      return;
    }

    // Extract token from URL or use as-is
    let token = joinToken.trim();
    
    // If it's a full URL, extract the token
    if (token.includes('/invite/')) {
      const parts = token.split('/invite/');
      token = parts[parts.length - 1].split('#')[0].split('?')[0];
    }

    if (!currentUser) return;

    const result = acceptInvitation(token, currentUser.id);
    
    if (result.success) {
      setJoinMessage({ type: 'success', text: 'Invitation accepted! Redirecting...' });
      setJoinToken('');
      
      // Find the invitation to get role and auction ID
      const invitation = invitations.find(i => i.token === token);
      if (invitation) {
        setTimeout(() => {
          const role = invitation.role;
          const auctionId = invitation.auctionId;
          if (role === 'captain') {
            navigate(`/auction/${auctionId}/captain`);
          } else if (role === 'auctioneer') {
            navigate(`/auction/${auctionId}/auctioneer`);
          } else if (role === 'streamer') {
            navigate(`/auction/${auctionId}/streamer`);
          } else {
            navigate(`/auction/${auctionId}/spectator`);
          }
        }, 1000);
      } else {
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } else {
      setJoinMessage({ type: 'error', text: result.error || 'Failed to accept invitation.' });
    }

    // Clear message after 3 seconds
    setTimeout(() => setJoinMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">MedAuction</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:block">
              Welcome, <strong>{currentUser.name}</strong>
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Hash, color: 'text-slate-600' },
            { label: 'Live', value: stats.live, icon: Radio, color: 'text-green-600' },
            { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: 'text-blue-600' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-purple-600' },
            { label: 'Drafts', value: stats.draft, icon: Clock, color: 'text-slate-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-slate-500 uppercase font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Join Auction Card */}
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-1">Join an Auction</h3>
              <p className="text-sm text-slate-600">Paste your invitation link or token to join as a captain, auctioneer, or streamer.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={joinToken}
              onChange={e => { setJoinToken(e.target.value); setJoinMessage(null); }}
              onKeyDown={e => e.key === 'Enter' && handleJoinAuction()}
              placeholder="https://example.com/#/invite/abc123... or paste token"
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            />
            <button
              onClick={handleJoinAuction}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition shadow-sm whitespace-nowrap"
            >
              Join Auction
            </button>
          </div>
          {joinMessage && (
            <div className={`mt-3 px-3 py-2 rounded-lg text-sm ${
              joinMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {joinMessage.text}
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search auctions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <button
              onClick={() => seedDemoData()}
              className="flex items-center gap-2 px-3 py-2.5 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition text-sm"
              title="Load demo auction data"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Demo</span>
            </button>
            <Link
              to="/auction/new/setup"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-blue-600 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Auction</span>
            </Link>
          </div>
        </div>

        {/* Auction Grid */}
        {filteredAuctions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No auctions yet</h3>
            <p className="text-slate-400 mb-6">Create your first auction or load demo data to explore</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/auction/new/setup"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
              >
                <Plus className="w-4 h-4" /> Create Auction
              </Link>
              <button
                onClick={() => { seedDemoData(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                <Sparkles className="w-4 h-4" /> Load Demo Data
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAuctions.map(auction => {
              const role = getUserRole(auction.id);
              const teamCount = getAuctionTeamCount(auction.id);
              const lotCount = getAuctionLotCount(auction.id);
              const StatusIcon = statusIcons[auction.status];
              const activeRun = runs.find(r => r.auctionId === auction.id && r.status === 'active');

              return (
                <div key={auction.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg">{auction.name}</h3>
                        <p className="text-sm text-slate-500">{auction.category}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[auction.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {auction.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        <span>{teamCount} teams</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Hash className="w-3.5 h-3.5" />
                        <span>{lotCount} lots</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(auction.scheduledAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Settings className="w-3.5 h-3.5" />
                        <span className="capitalize">{role}</span>
                      </div>
                    </div>

                    {activeRun && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3 text-sm">
                        <span className="text-green-700 font-medium">● Live Run Active</span>
                        <span className="text-green-600 ml-2">
                          Sold: {activeRun.soldCount} | Unsold: {activeRun.unsoldCount}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {role === 'owner' && (
                        <Link
                          to={`/auction/${auction.id}/setup`}
                          className="flex-1 text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                        >
                          Manage
                        </Link>
                      )}
                      {role === 'auctioneer' && (
                        <Link
                          to={`/auction/${auction.id}/auctioneer`}
                          className="flex-1 text-center py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition"
                        >
                          Open Auction
                        </Link>
                      )}
                      {role === 'captain' && (
                        <Link
                          to={`/auction/${auction.id}/captain`}
                          className="flex-1 text-center py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition"
                        >
                          My Team
                        </Link>
                      )}
                      {role === 'streamer' && (
                        <Link
                          to={`/auction/${auction.id}/streamer`}
                          className="flex-1 text-center py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition"
                        >
                          Streamer
                        </Link>
                      )}
                      {role === 'owner' && (
                        <Link
                          to={`/auction/${auction.id}/auctioneer`}
                          className="flex-1 text-center py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition"
                        >
                          Auctioneer
                        </Link>
                      )}
                      <Link
                        to={`/auction/${auction.id}/spectator`}
                        className="flex-1 text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition border border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
