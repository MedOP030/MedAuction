import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { Auction, Team, Lot, AuctionSettings, DEFAULT_SETTINGS, TEAM_COLORS, AUCTION_CATEGORIES, Currency, formatCurrency, generateId } from '../types';
import {
  Trophy, ArrowLeft, Save, Users, Package, Settings, Radio,
  Plus, Trash2, Edit2, Check, X, Eye, FileText, Mail, Monitor
} from 'lucide-react';

type Tab = 'details' | 'teams' | 'lots' | 'settings';

export default function AuctionSetup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useStore(s => s.currentUser);
  const auctions = useStore(s => s.auctions);
  const createAuction = useStore(s => s.createAuction);
  const updateAuction = useStore(s => s.updateAuction);
  const changeAuctionStatus = useStore(s => s.changeAuctionStatus);
  const teams = useStore(s => s.teams).filter(t => t.auctionId === (id === 'new' ? '' : id));
  const lots = useStore(s => s.lots).filter(l => l.auctionId === (id === 'new' ? '' : id));
  const createTeam = useStore(s => s.createTeam);
  const updateTeam = useStore(s => s.updateTeam);
  const deleteTeam = useStore(s => s.deleteTeam);
  const createLot = useStore(s => s.createLot);
  const updateLot = useStore(s => s.updateLot);
  const deleteLot = useStore(s => s.deleteLot);
  const runs = useStore(s => s.runs);
  const createRun = useStore(s => s.createRun);
  const startRun = useStore(s => s.startRun);

  const [tab, setTab] = useState<Tab>('details');
  const [auction, setAuction] = useState<Partial<Auction>>({
    name: '', description: '', category: 'Medical College Tournament',
    eventType: '', organizer: currentUser?.name || '', currency: 'INR' as Currency,
    isPublic: false, settings: { ...DEFAULT_SETTINGS },
    scheduledAt: new Date().toISOString(),
  });
  const [saved, setSaved] = useState(false);
  const [auctionId, setAuctionId] = useState<string | null>(id === 'new' ? null : id || null);

  // Load existing auction
  useEffect(() => {
    if (id && id !== 'new') {
      const existing = auctions.find(a => a.id === id);
      if (existing) {
        setAuction(existing);
        setAuctionId(existing.id);
      }
    }
  }, [id, auctions]);

  const handleSave = () => {
    if (!auction.name) return;
    if (auctionId) {
      updateAuction(auctionId, auction);
    } else {
      const newAuction = createAuction(auction);
      setAuctionId(newAuction.id);
      navigate(`/auction/${newAuction.id}/setup`, { replace: true });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGoLive = () => {
    if (!auctionId) return;
    handleSave();
    changeAuctionStatus(auctionId, 'live');
    const run = createRun(auctionId, 'official');
    startRun(run.id);
    navigate(`/auction/${auctionId}/auctioneer`);
  };

  const currentTeams = auctionId ? useStore.getState().teams.filter(t => t.auctionId === auctionId) : [];
  const currentLots = auctionId ? useStore.getState().lots.filter(l => l.auctionId === auctionId) : [];

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-800">{auction.name || 'New Auction'}</span>
              {auction.status && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs capitalize">{auction.status}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition">
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save'}
            </button>
            {auctionId && auction.status !== 'live' && (
              <button onClick={handleGoLive} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition">
                <Radio className="w-4 h-4" /> Go Live
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          {[
            { id: 'details' as Tab, label: 'Details', icon: Settings },
            { id: 'teams' as Tab, label: `Teams (${currentTeams.length})`, icon: Users },
            { id: 'lots' as Tab, label: `Lots (${currentLots.length})`, icon: Package },
            { id: 'settings' as Tab, label: 'Rules', icon: Settings },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === t.id ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Navigation Links */}
        {auctionId && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Link to={`/auction/${auctionId}/auctioneer`} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition">
              <Radio className="w-3.5 h-3.5" /> Auctioneer
            </Link>
            <Link to={`/auction/${auctionId}/invitations`} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition">
              <Mail className="w-3.5 h-3.5" /> Invitations
            </Link>
            <Link to={`/auction/${auctionId}/reports`} className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition">
              <FileText className="w-3.5 h-3.5" /> Reports
            </Link>
            <Link to={`/auction/${auctionId}/streamer`} className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200 transition">
              <Monitor className="w-3.5 h-3.5" /> Streamer
            </Link>
            <Link to={`/auction/${auctionId}/spectator`} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition">
              <Eye className="w-3.5 h-3.5" /> Spectator
            </Link>
          </div>
        )}

        {/* Tab Content */}
        {tab === 'details' && <DetailsTab auction={auction} setAuction={setAuction} />}
        {tab === 'teams' && <TeamsTab auctionId={auctionId} />}
        {tab === 'lots' && <LotsTab auctionId={auctionId} auction={auction} />}
        {tab === 'settings' && <SettingsTab auction={auction} setAuction={setAuction} />}
      </div>
    </div>
  );
}

function DetailsTab({ auction, setAuction }: { auction: Partial<Auction>; setAuction: (a: Partial<Auction>) => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Auction Details</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Auction Name *</label>
          <input
            type="text"
            value={auction.name || ''}
            onChange={e => setAuction({ ...auction, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="e.g., IPL Medical College Tournament 2024"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            value={auction.category || ''}
            onChange={e => setAuction({ ...auction, category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
          >
            {AUCTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Event Type / Sport</label>
          <input
            type="text"
            value={auction.eventType || ''}
            onChange={e => setAuction({ ...auction, eventType: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="e.g., Cricket, Football, Quiz"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organizer</label>
          <input
            type="text"
            value={auction.organizer || ''}
            onChange={e => setAuction({ ...auction, organizer: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
          <input
            type="datetime-local"
            value={auction.scheduledAt ? auction.scheduledAt.slice(0, 16) : ''}
            onChange={e => setAuction({ ...auction, scheduledAt: new Date(e.target.value).toISOString() })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
          <select
            value={auction.currency || 'INR'}
            onChange={e => setAuction({ ...auction, currency: e.target.value as Currency })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
          >
            <option value="INR">₹ INR (Indian Rupee)</option>
            <option value="USD">$ USD (US Dollar)</option>
            <option value="EUR">€ EUR (Euro)</option>
            <option value="GBP">£ GBP (British Pound)</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={auction.description || ''}
            onChange={e => setAuction({ ...auction, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none"
            placeholder="Describe your auction event..."
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={auction.isPublic || false}
              onChange={e => setAuction({ ...auction, isPublic: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
          </label>
          <span className="text-sm text-slate-700">Public auction (visible to spectators)</span>
        </div>
      </div>
    </div>
  );
}

function TeamsTab({ auctionId }: { auctionId: string | null }) {
  const teams = auctionId ? useStore(s => s.teams).filter(t => t.auctionId === auctionId) : [];
  const createTeam = useStore(s => s.createTeam);
  const updateTeam = useStore(s => s.updateTeam);
  const deleteTeam = useStore(s => s.deleteTeam);
  const auctions = useStore(s => s.auctions);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(TEAM_COLORS[0]);

  const auction = auctionId ? auctions.find(a => a.id === auctionId) : null;

  const handleAdd = () => {
    if (!auctionId || !name) return;
    createTeam(auctionId, { name, color });
    setName('');
    setColor(TEAM_COLORS[(teams.length) % TEAM_COLORS.length]);
    setShowForm(false);
  };

  const handleEdit = (team: Team) => {
    setEditId(team.id);
    setName(team.name);
    setColor(team.color);
    setShowForm(true);
  };

  const handleSaveEdit = () => {
    if (!editId || !name) return;
    updateTeam(editId, { name, color });
    setEditId(null);
    setShowForm(false);
    setName('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Teams</h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setName(''); setColor(TEAM_COLORS[teams.length % TEAM_COLORS.length]); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
        >
          <Plus className="w-4 h-4" /> Add Team
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Team name"
            />
            <div className="flex gap-1.5 flex-wrap">
              {TEAM_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={editId ? handleSaveEdit : handleAdd} className="px-3 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition">
                {editId ? 'Update' : 'Add'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No teams yet. Add your first team.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: team.color }} />
                  <div>
                    <h3 className="font-semibold text-slate-800">{team.name}</h3>
                    <p className="text-xs text-slate-500">
                      {team.captainName ? `Captain: ${team.captainName}` : 'No captain assigned'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(team)} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button onClick={() => deleteTeam(team.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-500">Purse</p>
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(team.initialPurse, auction?.currency)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-500">Spent</p>
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(team.totalSpent, auction?.currency)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-500">Squad</p>
                  <p className="text-sm font-semibold text-slate-800">{team.squadSize}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LotsTab({ auctionId, auction }: { auctionId: string | null; auction: Partial<Auction> }) {
  const lots = auctionId ? useStore(s => s.lots).filter(l => l.auctionId === auctionId).sort((a, b) => a.queuePosition - b.queuePosition) : [];
  const createLot = useStore(s => s.createLot);
  const updateLot = useStore(s => s.updateLot);
  const deleteLot = useStore(s => s.deleteLot);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [basePrice, setBasePrice] = useState(auction.settings?.basePrice || DEFAULT_SETTINGS.basePrice);
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!auctionId || !name) return;
    createLot(auctionId, { name, category, basePrice, description, queuePosition: lots.length + 1 });
    setName(''); setCategory(''); setBasePrice(auction.settings?.basePrice || DEFAULT_SETTINGS.basePrice); setDescription('');
    setShowForm(false);
  };

  const handleEdit = (lot: Lot) => {
    setEditId(lot.id);
    setName(lot.name);
    setCategory(lot.category);
    setBasePrice(lot.basePrice);
    setDescription(lot.description);
    setShowForm(true);
  };

  const handleSaveEdit = () => {
    if (!editId || !name) return;
    updateLot(editId, { name, category, basePrice, description });
    setEditId(null); setShowForm(false); setName(''); setCategory(''); setDescription('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Lots / Players / Items</h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setName(''); setCategory(''); setBasePrice(auction.settings?.basePrice || DEFAULT_SETTINGS.basePrice); setDescription(''); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
        >
          <Plus className="w-4 h-4" /> Add Lot
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Name" />
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Category" />
            <input type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Base Price" />
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Description (optional)" />
          </div>
          <div className="flex gap-2">
            <button onClick={editId ? handleSaveEdit : handleAdd} className="px-3 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition">
              {editId ? 'Update' : 'Add'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition">Cancel</button>
          </div>
        </div>
      )}

      {lots.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No lots yet. Add players or items to auction.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Base Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lots.map((lot, i) => (
                <tr key={lot.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{lot.name}</td>
                  <td className="px-4 py-3 text-slate-600">{lot.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-800">{formatCurrency(lot.basePrice, auction.currency as Currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      lot.status === 'pending' ? 'bg-slate-100 text-slate-600' :
                      lot.status === 'active' ? 'bg-green-100 text-green-700' :
                      lot.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                      lot.status === 'unsold' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {lot.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(lot)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="w-3.5 h-3.5 text-slate-500" /></button>
                      <button onClick={() => deleteLot(lot.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ auction, setAuction }: { auction: Partial<Auction>; setAuction: (a: Partial<Auction>) => void }) {
  const settings = auction.settings || DEFAULT_SETTINGS;
  const updateSettings = (key: keyof AuctionSettings, value: any) => {
    setAuction({ ...auction, settings: { ...settings, [key]: value } });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Auction Rules & Settings</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Team Purse ({CURRENCY_SYMBOLS[auction.currency || 'INR']})</label>
          <input type="number" value={settings.teamPurse} onChange={e => updateSettings('teamPurse', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Base Price ({CURRENCY_SYMBOLS[auction.currency || 'INR']})</label>
          <input type="number" value={settings.basePrice} onChange={e => updateSettings('basePrice', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Bid Increment ({CURRENCY_SYMBOLS[auction.currency || 'INR']})</label>
          <input type="number" value={settings.minIncrement} onChange={e => updateSettings('minIncrement', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Squad Size</label>
          <input type="number" value={settings.minSquadSize} onChange={e => updateSettings('minSquadSize', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Squad Size</label>
          <input type="number" value={settings.maxSquadSize} onChange={e => updateSettings('maxSquadSize', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bidding Mode</label>
          <select value={settings.biddingMode} onChange={e => updateSettings('biddingMode', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white">
            <option value="online">Online</option>
            <option value="offline">Offline/Manual</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quick Bid Buttons (comma-separated)</label>
          <input
            type="text"
            value={settings.quickBidIncrements.join(', ')}
            onChange={e => updateSettings('quickBidIncrements', e.target.value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="200, 500, 1000, 2000"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.countdownEnabled} onChange={e => updateSettings('countdownEnabled', e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
          </label>
          <span className="text-sm text-slate-700">Enable countdown timer</span>
        </div>
        {settings.countdownEnabled && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Countdown Duration (seconds)</label>
            <input type="number" value={settings.countdownDuration} onChange={e => updateSettings('countdownDuration', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
        )}
      </div>
    </div>
  );
}

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
