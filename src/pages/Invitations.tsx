import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Mail, Plus, Trash2, Copy, Check, Users, Radio, Eye, Monitor } from 'lucide-react';

export default function Invitations() {
  const { id } = useParams<{ id: string }>();
  const auction = useStore(s => s.auctions).find(a => a.id === id);
  const teams = useStore(s => s.teams).filter(t => t.auctionId === id);
  const invitations = useStore(s => s.invitations).filter(i => i.auctionId === id);
  const memberships = useStore(s => s.memberships).filter(m => m.auctionId === id);
  const users = useStore(s => s.users);
  const createInvitation = useStore(s => s.createInvitation);
  const revokeInvitation = useStore(s => s.revokeInvitation);
  const addMembership = useStore(s => s.addMembership);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'auctioneer' | 'captain' | 'streamer' | 'spectator'>('captain');
  const [teamId, setTeamId] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (!auction) return null;

  const handleCreate = () => {
    if (!id || !email) return;
    createInvitation(id, email, role, role === 'captain' ? teamId : null);
    setEmail('');
    setTeamId('');
    setShowForm(false);
  };

  const handleCopyToken = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getRoleIcon = (r: string) => {
    switch (r) {
      case 'auctioneer': return Radio;
      case 'captain': return Users;
      case 'streamer': return Monitor;
      case 'spectator': return Eye;
      default: return Users;
    }
  };

  const getRoleColor = (r: string) => {
    switch (r) {
      case 'auctioneer': return 'bg-green-100 text-green-700';
      case 'captain': return 'bg-blue-100 text-blue-700';
      case 'streamer': return 'bg-purple-100 text-purple-700';
      case 'spectator': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to={`/auction/${id}/setup`} className="p-2 hover:bg-slate-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <Mail className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-800">Invitations — {auction.name}</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
          >
            <Plus className="w-4 h-4" /> Invite
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Invitation Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Send Invitation</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="participant@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  <option value="captain">Team Captain</option>
                  <option value="auctioneer">Auctioneer</option>
                  <option value="streamer">Streamer / Projector</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>
              {role === 'captain' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Team</label>
                  <select
                    value={teamId}
                    onChange={e => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="">Select team...</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition">
                Send Invitation
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Current Members */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Current Members</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {memberships.length === 0 ? (
              <p className="p-4 text-slate-400 text-sm">No members yet</p>
            ) : (
              memberships.map(m => {
                const user = users.find(u => u.id === m.userId);
                const team = m.teamId ? teams.find(t => t.id === m.teamId) : null;
                const RoleIcon = getRoleIcon(m.role);
                return (
                  <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <RoleIcon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{user?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(m.role)}`}>
                        {m.role}
                      </span>
                      {team && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                          {team.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Invitations</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {invitations.length === 0 ? (
              <p className="p-4 text-slate-400 text-sm">No invitations sent</p>
            ) : (
              invitations.map(inv => {
                const team = inv.teamId ? teams.find(t => t.id === inv.teamId) : null;
                return (
                  <div key={inv.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(inv.role)}`}>
                          {inv.role}
                        </span>
                        {team && <span className="text-xs text-slate-500">→ {team.name}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          inv.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          inv.status === 'revoked' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{inv.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {inv.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleCopyToken(inv.token)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                            title="Copy invitation link"
                          >
                            {copiedToken === inv.token ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                          </button>
                          <button
                            onClick={() => revokeInvitation(inv.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition"
                            title="Revoke invitation"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
