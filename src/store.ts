import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User, Auction, Team, Lot, AuctionRun, Bid, AuctionMembership,
  Invitation, AuctionAction, Purchase, AuctionSettings, AuctionStatus,
  AuctionMode, LotStatus, RunStatus, DEFAULT_SETTINGS, generateId,
  validateBid, getRemainingPurse, getAvailableSlots, formatCurrency, Currency
} from './types';

interface AppState {
  // Auth
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (email: string, password: string, name: string) => { success: boolean; error?: string };
  logout: () => void;
  passwords: Record<string, string>;

  // Auctions
  auctions: Auction[];
  createAuction: (data: Partial<Auction>) => Auction;
  updateAuction: (id: string, data: Partial<Auction>) => void;
  deleteAuction: (id: string) => void;
  changeAuctionStatus: (id: string, status: AuctionStatus) => void;

  // Teams
  teams: Team[];
  createTeam: (auctionId: string, data: Partial<Team>) => Team;
  updateTeam: (id: string, data: Partial<Team>) => void;
  deleteTeam: (id: string) => void;

  // Lots
  lots: Lot[];
  createLot: (auctionId: string, data: Partial<Lot>) => Lot;
  updateLot: (id: string, data: Partial<Lot>) => void;
  deleteLot: (id: string) => void;
  reorderLots: (auctionId: string, lotIds: string[]) => void;

  // Runs
  runs: AuctionRun[];
  createRun: (auctionId: string, mode: AuctionMode) => AuctionRun;
  startRun: (runId: string) => void;
  pauseRun: (runId: string) => void;
  resumeRun: (runId: string) => void;
  completeRun: (runId: string) => void;
  startNextLot: (runId: string) => void;
  skipLot: (runId: string) => void;
  markSold: (runId: string) => void;
  markUnsold: (runId: string) => void;
  undoLastSale: (runId: string) => void;

  // Bids
  bids: Bid[];
  placeBid: (runId: string, lotId: string, teamId: string, amount: number) => { success: boolean; error?: string };

  // Memberships
  memberships: AuctionMembership[];
  addMembership: (auctionId: string, userId: string, role: string, teamId?: string | null) => void;
  removeMembership: (id: string) => void;
  getUserRole: (auctionId: string, userId: string) => string | null;
  getUserTeam: (auctionId: string, userId: string) => string | null;

  // Invitations
  invitations: Invitation[];
  createInvitation: (auctionId: string, email: string, role: string, teamId?: string | null) => Invitation;
  acceptInvitation: (token: string, userId: string) => { success: boolean; error?: string };
  revokeInvitation: (id: string) => void;

  // Actions (audit log)
  actions: AuctionAction[];
  logAction: (auctionId: string, type: string, description: string, metadata?: Record<string, any>) => void;

  // Purchases
  purchases: Purchase[];

  // UI State
  activeAuctionId: string | null;
  setActiveAuction: (id: string | null) => void;

  // Demo
  seedDemoData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      currentUser: null,
      users: [],
      passwords: {},

      login: (email: string, password: string) => {
        const state = get();
        const user = state.users.find(u => u.email === email);
        if (!user) return { success: false, error: 'Invalid email or password.' };
        if (state.passwords[email] !== password) return { success: false, error: 'Invalid email or password.' };
        set({ currentUser: user });
        return { success: true };
      },

      register: (email: string, password: string, name: string) => {
        const state = get();
        if (state.users.find(u => u.email === email)) {
          return { success: false, error: 'An account with this email already exists.' };
        }
        const user: User = {
          id: generateId(),
          email,
          name,
          createdAt: new Date().toISOString(),
          isPlatformAdmin: state.users.length === 0,
        };
        set({
          users: [...state.users, user],
          passwords: { ...state.passwords, [email]: password },
          currentUser: user,
        });
        return { success: true };
      },

      logout: () => set({ currentUser: null, activeAuctionId: null }),

      // Auctions
      auctions: [],

      createAuction: (data) => {
        const state = get();
        const auction: Auction = {
          id: generateId(),
          name: data.name || 'New Auction',
          description: data.description || '',
          category: data.category || 'Other',
          eventType: data.eventType || '',
          organizer: data.organizer || state.currentUser?.name || 'Unknown',
          organizerId: state.currentUser?.id || '',
          scheduledAt: data.scheduledAt || new Date().toISOString(),
          timezone: data.timezone || 'Asia/Kolkata',
          currency: data.currency || 'INR',
          isPublic: data.isPublic ?? false,
          status: 'draft',
          mode: 'official',
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ auctions: [...state.auctions, auction] });
        // Auto-add owner membership
        if (state.currentUser) {
          set({
            memberships: [...state.memberships, {
              id: generateId(),
              auctionId: auction.id,
              userId: state.currentUser.id,
              role: 'owner',
              teamId: null,
              createdAt: new Date().toISOString(),
            }]
          });
        }
        return auction;
      },

      updateAuction: (id, data) => {
        set({
          auctions: get().auctions.map(a =>
            a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
          ),
        });
      },

      deleteAuction: (id) => {
        set({
          auctions: get().auctions.filter(a => a.id !== id),
          teams: get().teams.filter(t => t.auctionId !== id),
          lots: get().lots.filter(l => l.auctionId !== id),
          runs: get().runs.filter(r => r.auctionId !== id),
          bids: get().bids.filter(b => b.auctionId !== id),
          memberships: get().memberships.filter(m => m.auctionId !== id),
          invitations: get().invitations.filter(i => i.auctionId !== id),
          actions: get().actions.filter(a => a.auctionId !== id),
          purchases: get().purchases.filter(p => p.auctionId !== id),
        });
      },

      changeAuctionStatus: (id, status) => {
        get().updateAuction(id, { status });
        get().logAction(id, 'status_change', `Auction status changed to ${status}`);
      },

      // Teams
      teams: [],

      createTeam: (auctionId, data) => {
        const state = get();
        const auction = state.auctions.find(a => a.id === auctionId);
        const team: Team = {
          id: generateId(),
          auctionId,
          name: data.name || 'New Team',
          color: data.color || '#1e40af',
          captainId: data.captainId || null,
          captainName: data.captainName || '',
          initialPurse: auction?.settings.teamPurse || DEFAULT_SETTINGS.teamPurse,
          totalSpent: 0,
          squadSize: 0,
          createdAt: new Date().toISOString(),
        };
        set({ teams: [...state.teams, team] });
        return team;
      },

      updateTeam: (id, data) => {
        set({
          teams: get().teams.map(t => t.id === id ? { ...t, ...data } : t),
        });
      },

      deleteTeam: (id) => {
        set({ teams: get().teams.filter(t => t.id !== id) });
      },

      // Lots
      lots: [],

      createLot: (auctionId, data) => {
        const state = get();
        const existingLots = state.lots.filter(l => l.auctionId === auctionId);
        const lot: Lot = {
          id: generateId(),
          auctionId,
          name: data.name || 'New Lot',
          category: data.category || '',
          description: data.description || '',
          basePrice: data.basePrice || state.auctions.find(a => a.id === auctionId)?.settings.basePrice || DEFAULT_SETTINGS.basePrice,
          attributes: data.attributes || {},
          queuePosition: data.queuePosition ?? existingLots.length + 1,
          status: 'pending',
          winningTeamId: null,
          winningTeamName: '',
          finalPrice: null,
          photoUrl: data.photoUrl || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ lots: [...state.lots, lot] });
        return lot;
      },

      updateLot: (id, data) => {
        set({
          lots: get().lots.map(l =>
            l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
          ),
        });
      },

      deleteLot: (id) => {
        set({ lots: get().lots.filter(l => l.id !== id) });
      },

      reorderLots: (auctionId, lotIds) => {
        set({
          lots: get().lots.map(l => {
            if (l.auctionId !== auctionId) return l;
            const newPos = lotIds.indexOf(l.id);
            return { ...l, queuePosition: newPos >= 0 ? newPos + 1 : l.queuePosition };
          }),
        });
      },

      // Runs
      runs: [],

      createRun: (auctionId, mode) => {
        const state = get();
        const run: AuctionRun = {
          id: generateId(),
          auctionId,
          mode,
          status: 'idle',
          currentLotId: null,
          currentHighestBid: 0,
          currentLeadingTeamId: null,
          currentLeadingTeamName: '',
          soldCount: 0,
          unsoldCount: 0,
          skippedCount: 0,
          startedAt: null,
          completedAt: null,
          createdAt: new Date().toISOString(),
        };
        set({ runs: [...state.runs, run] });
        return run;
      },

      startRun: (runId) => {
        set({
          runs: get().runs.map(r =>
            r.id === runId ? { ...r, status: 'active' as RunStatus, startedAt: new Date().toISOString() } : r
          ),
        });
      },

      pauseRun: (runId) => {
        set({
          runs: get().runs.map(r =>
            r.id === runId ? { ...r, status: 'paused' as RunStatus } : r
          ),
        });
        const run = get().runs.find(r => r.id === runId);
        if (run) get().logAction(run.auctionId, 'pause', 'Auction paused', { runId });
      },

      resumeRun: (runId) => {
        set({
          runs: get().runs.map(r =>
            r.id === runId ? { ...r, status: 'active' as RunStatus } : r
          ),
        });
        const run = get().runs.find(r => r.id === runId);
        if (run) get().logAction(run.auctionId, 'resume', 'Auction resumed', { runId });
      },

      completeRun: (runId) => {
        set({
          runs: get().runs.map(r =>
            r.id === runId ? { ...r, status: 'completed' as RunStatus, completedAt: new Date().toISOString() } : r
          ),
        });
      },

      startNextLot: (runId) => {
        const state = get();
        const run = state.runs.find(r => r.id === runId);
        if (!run) return;

        const auctionLots = state.lots
          .filter(l => l.auctionId === run.auctionId && l.status === 'pending')
          .sort((a, b) => a.queuePosition - b.queuePosition);

        if (auctionLots.length === 0) {
          get().completeRun(runId);
          get().changeAuctionStatus(run.auctionId, 'completed');
          return;
        }

        const nextLot = auctionLots[0];
        set({
          lots: state.lots.map(l =>
            l.id === nextLot.id ? { ...l, status: 'active' as LotStatus } : l
          ),
          runs: state.runs.map(r =>
            r.id === runId ? {
              ...r,
              currentLotId: nextLot.id,
              currentHighestBid: 0,
              currentLeadingTeamId: null,
              currentLeadingTeamName: '',
            } : r
          ),
        });
        get().logAction(run.auctionId, 'lot_started', `Lot "${nextLot.name}" started`, { runId, lotId: nextLot.id });
      },

      skipLot: (runId) => {
        const state = get();
        const run = state.runs.find(r => r.id === runId);
        if (!run || !run.currentLotId) return;

        set({
          lots: state.lots.map(l =>
            l.id === run.currentLotId ? { ...l, status: 'skipped' as LotStatus } : l
          ),
          runs: state.runs.map(r =>
            r.id === runId ? {
              ...r,
              currentLotId: null,
              currentHighestBid: 0,
              currentLeadingTeamId: null,
              currentLeadingTeamName: '',
              skippedCount: r.skippedCount + 1,
            } : r
          ),
        });
        get().logAction(run.auctionId, 'lot_skipped', 'Lot skipped', { runId });
      },

      markSold: (runId) => {
        const state = get();
        const run = state.runs.find(r => r.id === runId);
        if (!run || !run.currentLotId || !run.currentLeadingTeamId) return;

        const lot = state.lots.find(l => l.id === run.currentLotId);
        if (!lot) return;

        const team = state.teams.find(t => t.id === run.currentLeadingTeamId);
        if (!team) return;

        const salePrice = run.currentHighestBid || lot.basePrice;

        // Create purchase
        const purchase: Purchase = {
          id: generateId(),
          auctionId: run.auctionId,
          runId,
          lotId: lot.id,
          lotName: lot.name,
          teamId: team.id,
          teamName: team.name,
          price: salePrice,
          createdAt: new Date().toISOString(),
        };

        set({
          lots: state.lots.map(l =>
            l.id === lot.id ? {
              ...l,
              status: 'sold' as LotStatus,
              winningTeamId: team.id,
              winningTeamName: team.name,
              finalPrice: salePrice,
            } : l
          ),
          teams: state.teams.map(t =>
            t.id === team.id ? {
              ...t,
              totalSpent: t.totalSpent + salePrice,
              squadSize: t.squadSize + 1,
            } : t
          ),
          runs: state.runs.map(r =>
            r.id === runId ? {
              ...r,
              currentLotId: null,
              currentHighestBid: 0,
              currentLeadingTeamId: null,
              currentLeadingTeamName: '',
              soldCount: r.soldCount + 1,
            } : r
          ),
          purchases: [...state.purchases, purchase],
        });

        get().logAction(run.auctionId, 'sold',
          `"${lot.name}" sold to ${team.name} for ${formatCurrency(salePrice, state.auctions.find(a => a.id === run.auctionId)?.currency)}`,
          { runId, lotId: lot.id, teamId: team.id, price: salePrice }
        );
      },

      markUnsold: (runId) => {
        const state = get();
        const run = state.runs.find(r => r.id === runId);
        if (!run || !run.currentLotId) return;

        set({
          lots: state.lots.map(l =>
            l.id === run.currentLotId ? { ...l, status: 'unsold' as LotStatus } : l
          ),
          runs: state.runs.map(r =>
            r.id === runId ? {
              ...r,
              currentLotId: null,
              currentHighestBid: 0,
              currentLeadingTeamId: null,
              currentLeadingTeamName: '',
              unsoldCount: r.unsoldCount + 1,
            } : r
          ),
        });
        get().logAction(run.auctionId, 'unsold', 'Lot marked unsold', { runId });
      },

      undoLastSale: (runId) => {
        const state = get();
        const run = state.runs.find(r => r.id === runId);
        if (!run) return;

        // Find last purchase for this run
        const lastPurchase = state.purchases
          .filter(p => p.runId === runId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (!lastPurchase) return;

        set({
          lots: state.lots.map(l =>
            l.id === lastPurchase.lotId ? {
              ...l,
              status: 'pending' as LotStatus,
              winningTeamId: null,
              winningTeamName: '',
              finalPrice: null,
            } : l
          ),
          teams: state.teams.map(t =>
            t.id === lastPurchase.teamId ? {
              ...t,
              totalSpent: t.totalSpent - lastPurchase.price,
              squadSize: t.squadSize - 1,
            } : t
          ),
          purchases: state.purchases.filter(p => p.id !== lastPurchase.id),
          runs: state.runs.map(r =>
            r.id === runId ? { ...r, soldCount: r.soldCount - 1 } : r
          ),
        });

        get().logAction(run.auctionId, 'undo_sale',
          `Undo: "${lastPurchase.lotName}" sale to ${lastPurchase.teamName} reversed`,
          { runId, purchaseId: lastPurchase.id }
        );
      },

      // Bids
      bids: [],

      placeBid: (runId, lotId, teamId, amount) => {
        const state = get();
        const run = state.runs.find(r => r.id === runId);
        const lot = state.lots.find(l => l.id === lotId);
        const team = state.teams.find(t => t.id === teamId);
        const auction = state.auctions.find(a => a.id === run?.auctionId);

        if (!run || !lot || !team || !auction) {
          return { success: false, error: 'Invalid auction state.' };
        }

        const validation = validateBid(
          { amount, teamId },
          lot,
          team,
          run,
          auction.settings,
          run.currentLeadingTeamId
        );

        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        const bid: Bid = {
          id: generateId(),
          auctionId: auction.id,
          runId,
          lotId,
          teamId,
          teamName: team.name,
          userId: state.currentUser?.id || '',
          amount,
          sequence: state.bids.length + 1,
          createdAt: new Date().toISOString(),
        };

        set({
          bids: [...state.bids, bid],
          runs: state.runs.map(r =>
            r.id === runId ? {
              ...r,
              currentHighestBid: amount,
              currentLeadingTeamId: teamId,
              currentLeadingTeamName: team.name,
            } : r
          ),
        });

        return { success: true };
      },

      // Memberships
      memberships: [],

      addMembership: (auctionId, userId, role, teamId = null) => {
        const state = get();
        const existing = state.memberships.find(
          m => m.auctionId === auctionId && m.userId === userId
        );
        if (existing) {
          set({
            memberships: state.memberships.map(m =>
              m.id === existing.id ? { ...m, role: role as any, teamId } : m
            ),
          });
        } else {
          set({
            memberships: [...state.memberships, {
              id: generateId(),
              auctionId,
              userId,
              role: role as any,
              teamId,
              createdAt: new Date().toISOString(),
            }],
          });
        }
      },

      removeMembership: (id) => {
        set({ memberships: get().memberships.filter(m => m.id !== id) });
      },

      getUserRole: (auctionId, userId) => {
        const membership = get().memberships.find(
          m => m.auctionId === auctionId && m.userId === userId
        );
        return membership?.role || null;
      },

      getUserTeam: (auctionId, userId) => {
        const membership = get().memberships.find(
          m => m.auctionId === auctionId && m.userId === userId
        );
        return membership?.teamId || null;
      },

      // Invitations
      invitations: [],

      createInvitation: (auctionId, email, role, teamId = null) => {
        const state = get();
        const invitation: Invitation = {
          id: generateId(),
          auctionId,
          token: generateId(),
          email,
          role: role as any,
          teamId,
          status: 'pending',
          invitedBy: state.currentUser?.id || '',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          acceptedBy: null,
        };
        set({ invitations: [...state.invitations, invitation] });
        return invitation;
      },

      acceptInvitation: (token, userId) => {
        const state = get();
        const invitation = state.invitations.find(i => i.token === token);
        if (!invitation) return { success: false, error: 'Invitation not found.' };
        if (invitation.status !== 'pending') return { success: false, error: 'Invitation is no longer valid.' };
        if (new Date(invitation.expiresAt) < new Date()) return { success: false, error: 'Invitation has expired.' };

        set({
          invitations: state.invitations.map(i =>
            i.id === invitation.id ? { ...i, status: 'accepted' as const, acceptedBy: userId } : i
          ),
        });

        // Add membership
        get().addMembership(invitation.auctionId, userId, invitation.role, invitation.teamId);

        // If captain, update team
        if (invitation.role === 'captain' && invitation.teamId) {
          const user = state.users.find(u => u.id === userId);
          get().updateTeam(invitation.teamId, {
            captainId: userId,
            captainName: user?.name || '',
          });
        }

        return { success: true };
      },

      revokeInvitation: (id) => {
        set({
          invitations: get().invitations.map(i =>
            i.id === id ? { ...i, status: 'revoked' as const } : i
          ),
        });
      },

      // Actions
      actions: [],

      logAction: (auctionId, type, description, metadata = {}) => {
        const state = get();
        const action: AuctionAction = {
          id: generateId(),
          auctionId,
          runId: null,
          type,
          description,
          userId: state.currentUser?.id || 'system',
          userName: state.currentUser?.name || 'System',
          metadata,
          createdAt: new Date().toISOString(),
        };
        set({ actions: [...state.actions, action] });
      },

      // Purchases
      purchases: [],

      // UI
      activeAuctionId: null,
      setActiveAuction: (id) => set({ activeAuctionId: id }),

      // Demo
      seedDemoData: () => {
        const state = get();
        if (!state.currentUser) return;
        const userId = state.currentUser.id;

        // Create demo auction
        const auction = state.createAuction({
          name: 'IPL Medical College Tournament 2024',
          description: 'Annual cricket auction for medical college tournament teams',
          category: 'Medical College Tournament',
          eventType: 'Cricket',
          organizer: state.currentUser.name,
          currency: 'INR',
          isPublic: true,
          settings: {
            teamPurse: 20000,
            basePrice: 200,
            minIncrement: 200,
            quickBidIncrements: [200, 500, 1000, 2000],
            minSquadSize: 6,
            maxSquadSize: 8,
            biddingMode: 'online',
            countdownEnabled: false,
            countdownDuration: 30,
          },
        });

        // Create teams
        const team1 = state.createTeam(auction.id, { name: 'Thunder Strikers', color: '#1e40af' });
        const team2 = state.createTeam(auction.id, { name: 'Royal Challengers', color: '#dc2626' });
        const team3 = state.createTeam(auction.id, { name: 'Super Kings', color: '#d97706' });
        const team4 = state.createTeam(auction.id, { name: 'Knight Riders', color: '#7c3aed' });

        // Create lots (players)
        const players = [
          { name: 'Virat Sharma', category: 'Batsman', basePrice: 400 },
          { name: 'Rohit Patel', category: 'Batsman', basePrice: 400 },
          { name: 'Jasprit Singh', category: 'Bowler', basePrice: 300 },
          { name: 'Ravindra Kumar', category: 'All-Rounder', basePrice: 350 },
          { name: 'KL Reddy', category: 'Wicket-Keeper', basePrice: 300 },
          { name: 'Shubman Verma', category: 'Batsman', basePrice: 200 },
          { name: 'Yuzvendra Chahal', category: 'Bowler', basePrice: 200 },
          { name: 'Hardik Pandya', category: 'All-Rounder', basePrice: 350 },
          { name: 'Rishabh Pant', category: 'Wicket-Keeper', basePrice: 300 },
          { name: 'Mohammed Siraj', category: 'Bowler', basePrice: 200 },
          { name: 'Suryakumar Yadav', category: 'Batsman', basePrice: 200 },
          { name: 'Ravichandran Ashwin', category: 'All-Rounder', basePrice: 250 },
        ];

        players.forEach((p, i) => {
          state.createLot(auction.id, { ...p, queuePosition: i + 1 });
        });

        // Assign current user as captain of team 1
        state.addMembership(auction.id, userId, 'captain', team1.id);
        state.updateTeam(team1.id, { captainId: userId, captainName: state.currentUser.name });

        state.logAction(auction.id, 'demo_created', 'Demo auction created with sample data');
      },
    }),
    {
      name: 'medauction-storage',
    }
  )
);
