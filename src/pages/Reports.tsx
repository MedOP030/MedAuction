import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { formatCurrency, Currency, getRemainingPurse } from '../types';
import { ArrowLeft, FileText, Download, Trophy, Users, Package, DollarSign, AlertTriangle } from 'lucide-react';

export default function Reports() {
  const { id } = useParams<{ id: string }>();
  const auction = useStore(s => s.auctions).find(a => a.id === id);
  const teams = useStore(s => s.teams).filter(t => t.auctionId === id);
  const lots = useStore(s => s.lots).filter(l => l.auctionId === id);
  const purchases = useStore(s => s.purchases).filter(p => p.auctionId === id);
  const actions = useStore(s => s.actions).filter(a => a.auctionId === id);
  const runs = useStore(s => s.runs).filter(r => r.auctionId === id);

  if (!auction) return null;

  const soldLots = lots.filter(l => l.status === 'sold');
  const unsoldLots = lots.filter(l => l.status === 'unsold');
  const skippedLots = lots.filter(l => l.status === 'skipped');
  const totalSpending = purchases.reduce((sum, p) => sum + p.price, 0);
  const highestLot = soldLots.reduce((max, l) => (l.finalPrice || 0) > (max?.finalPrice || 0) ? l : max, soldLots[0]);
  const highestSpendingTeam = teams.reduce((max, t) => t.totalSpent > (max?.totalSpent || 0) ? t : max, teams[0]);

  // Financial consistency check
  const teamSpentTotal = teams.reduce((sum, t) => sum + t.totalSpent, 0);
  const purchaseTotal = purchases.reduce((sum, p) => sum + p.price, 0);
  const isConsistent = Math.abs(teamSpentTotal - purchaseTotal) < 0.01;

  const exportCSV = () => {
    const rows = [
      ['Lot', 'Category', 'Base Price', 'Status', 'Winning Team', 'Final Price'],
      ...lots.map(l => [
        l.name, l.category, l.basePrice.toString(), l.status,
        l.winningTeamName || '', (l.finalPrice || '').toString()
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${auction.name}-results.csv`;
    a.click();
  };

  const exportTeamReport = () => {
    const rows = [
      ['Team', 'Initial Purse', 'Total Spent', 'Remaining', 'Squad Size', 'Purchases'],
      ...teams.map(t => [
        t.name, t.initialPurse.toString(), t.totalSpent.toString(),
        getRemainingPurse(t).toString(), t.squadSize.toString(),
        purchases.filter(p => p.teamId === t.id).map(p => `${p.lotName}(${p.price})`).join('; ')
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${auction.name}-teams.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to={`/auction/${id}/setup`} className="p-2 hover:bg-slate-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <FileText className="w-5 h-5 text-purple-500" />
            <span className="font-bold text-slate-800">Reports — {auction.name}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition">
              <Download className="w-4 h-4" /> Export Lots
            </button>
            <button onClick={exportTeamReport} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">
              <Download className="w-4 h-4" /> Export Teams
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Consistency Warning */}
        {!isConsistent && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-700">Financial Consistency Warning</p>
              <p className="text-sm text-red-600">Team spending totals do not match purchase records. This may indicate data corruption.</p>
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <Package className="w-5 h-5 text-slate-400 mb-2" />
            <p className="text-2xl font-bold text-slate-800">{lots.length}</p>
            <p className="text-sm text-slate-500">Total Lots</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <Trophy className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600">{soldLots.length}</p>
            <p className="text-sm text-slate-500">Sold</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <Package className="w-5 h-5 text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-600">{unsoldLots.length}</p>
            <p className="text-sm text-slate-500">Unsold</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <DollarSign className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalSpending, auction.currency)}</p>
            <p className="text-sm text-slate-500">Total Spending</p>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid md:grid-cols-2 gap-4">
          {highestLot && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500 mb-1">Highest-Priced Lot</p>
              <p className="text-lg font-semibold text-slate-800">{highestLot.name}</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(highestLot.finalPrice || 0, auction.currency)}</p>
              <p className="text-sm text-slate-500">→ {highestLot.winningTeamName}</p>
            </div>
          )}
          {highestSpendingTeam && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500 mb-1">Highest-Spending Team</p>
              <p className="text-lg font-semibold text-slate-800">{highestSpendingTeam.name}</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(highestSpendingTeam.totalSpent, auction.currency)}</p>
              <p className="text-sm text-slate-500">{highestSpendingTeam.squadSize} purchases</p>
            </div>
          )}
        </div>

        {/* Team-wise Report */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Team-wise Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Team</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Initial Purse</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Spent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Remaining</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Squad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Purchases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teams.map(team => (
                  <tr key={team.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                        <span className="font-medium text-slate-800">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(team.initialPurse, auction.currency)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(team.totalSpent, auction.currency)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(getRemainingPurse(team), auction.currency)}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{team.squadSize}/{auction.settings.maxSquadSize}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                      {purchases.filter(p => p.teamId === team.id).map(p => p.lotName).join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Lots */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-500" /> All Lots
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Base Price</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Winner</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lots.sort((a, b) => a.queuePosition - b.queuePosition).map((lot, i) => (
                  <tr key={lot.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{lot.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(lot.basePrice, auction.currency)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        lot.status === 'sold' ? 'bg-green-100 text-green-700' :
                        lot.status === 'unsold' ? 'bg-red-100 text-red-700' :
                        lot.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{lot.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{lot.winningTeamName || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {lot.finalPrice ? formatCurrency(lot.finalPrice, auction.currency) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Action History</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {actions.length === 0 ? (
              <p className="p-4 text-slate-400 text-sm">No actions recorded</p>
            ) : (
              actions.slice().reverse().map(action => (
                <div key={action.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-700">{action.description}</span>
                    <span className="text-slate-400 ml-2">by {action.userName}</span>
                  </div>
                  <span className="text-slate-400 text-xs">{new Date(action.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
