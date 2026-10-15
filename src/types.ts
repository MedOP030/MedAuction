import { v4 as uuidv4 } from 'uuid';

// ============ CORE TYPES ============

export type AuctionStatus = 'draft' | 'upcoming' | 'live' | 'paused' | 'completed' | 'archived';
export type AuctionMode = 'practice' | 'official';
export type LotStatus = 'pending' | 'active' | 'sold' | 'unsold' | 'skipped';
export type RunStatus = 'idle' | 'active' | 'paused' | 'completed';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isPlatformAdmin: boolean;
}

export interface Auction {
  id: string;
  name: string;
  description: string;
  category: string;
  eventType: string;
  organizer: string;
  organizerId: string;
  scheduledAt: string;
  timezone: string;
  currency: Currency;
  isPublic: boolean;
  status: AuctionStatus;
  mode: AuctionMode;
  settings: AuctionSettings;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface AuctionSettings {
  teamPurse: number;
  basePrice: number;
  minIncrement: number;
  quickBidIncrements: number[];
  minSquadSize: number;
  maxSquadSize: number;
  biddingMode: 'online' | 'offline' | 'mixed';
  countdownEnabled: boolean;
  countdownDuration: number;
}

export interface Team {
  id: string;
  auctionId: string;
  name: string;
  color: string;
  captainId: string | null;
  captainName: string;
  initialPurse: number;
  totalSpent: number;
  squadSize: number;
  createdAt: string;
}

export interface Lot {
  id: string;
  auctionId: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  attributes: Record<string, string>;
  queuePosition: number;
  status: LotStatus;
  winningTeamId: string | null;
  winningTeamName: string;
  finalPrice: number | null;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionRun {
  id: string;
  auctionId: string;
  mode: AuctionMode;
  status: RunStatus;
  currentLotId: string | null;
  currentHighestBid: number;
  currentLeadingTeamId: string | null;
  currentLeadingTeamName: string;
  soldCount: number;
  unsoldCount: number;
  skippedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  runId: string;
  lotId: string;
  teamId: string;
  teamName: string;
  userId: string;
  amount: number;
  sequence: number;
  createdAt: string;
}

export interface AuctionMembership {
  id: string;
  auctionId: string;
  userId: string;
  role: 'owner' | 'auctioneer' | 'captain' | 'streamer' | 'spectator';
  teamId: string | null;
  createdAt: string;
}

export interface Invitation {
  id: string;
  auctionId: string;
  token: string;
  email: string;
  role: 'auctioneer' | 'captain' | 'streamer' | 'spectator';
  teamId: string | null;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
  acceptedBy: string | null;
}

export interface AuctionAction {
  id: string;
  auctionId: string;
  runId: string | null;
  type: string;
  description: string;
  userId: string;
  userName: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface Purchase {
  id: string;
  auctionId: string;
  runId: string;
  lotId: string;
  lotName: string;
  teamId: string;
  teamName: string;
  price: number;
  createdAt: string;
}

// ============ DEFAULT SETTINGS ============

export const DEFAULT_SETTINGS: AuctionSettings = {
  teamPurse: 20000,
  basePrice: 200,
  minIncrement: 200,
  quickBidIncrements: [200, 500, 1000, 2000],
  minSquadSize: 6,
  maxSquadSize: 8,
  biddingMode: 'online',
  countdownEnabled: false,
  countdownDuration: 30,
};

export const TEAM_COLORS = [
  '#1e40af', '#dc2626', '#16a34a', '#9333ea',
  '#ea580c', '#0891b2', '#be185d', '#4f46e5',
  '#059669', '#d97706', '#7c3aed', '#0284c7',
];

export const AUCTION_CATEGORIES = [
  'Medical College Tournament',
  'Sports League',
  'Student Organization',
  'Esports Tournament',
  'Charity Event',
  'Corporate Event',
  'Other',
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// ============ HELPERS ============

export function generateId(): string {
  return uuidv4();
}

export function formatCurrency(amount: number, currency: Currency = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toLocaleString()}`;
}

export function getRemainingPurse(team: Team): number {
  return team.initialPurse - team.totalSpent;
}

export function getAvailableSlots(team: Team, settings: AuctionSettings): number {
  return settings.maxSquadSize - team.squadSize;
}

export function getMinRequiredSpending(team: Team, settings: AuctionSettings): number {
  const slotsNeeded = Math.max(0, settings.minSquadSize - team.squadSize);
  return slotsNeeded * settings.basePrice;
}

export function getMaxPermittedBid(team: Team, settings: AuctionSettings): number {
  const remaining = getRemainingPurse(team);
  const minRequired = getMinRequiredSpending(team, settings);
  const availableSlots = getAvailableSlots(team, settings);
  if (availableSlots <= 0) return 0;
  return Math.max(0, remaining - minRequired);
}

export function validateBid(
  bid: { amount: number; teamId: string },
  lot: Lot,
  team: Team,
  run: AuctionRun,
  settings: AuctionSettings,
  currentLeadingTeamId: string | null
): { valid: boolean; error?: string } {
  // Check if team is already leading
  if (currentLeadingTeamId === bid.teamId) {
    return { valid: false, error: 'Your team is already leading.' };
  }

  // Check auction is accepting bids
  if (run.status !== 'active') {
    return { valid: false, error: 'The auction is not accepting bids.' };
  }

  // Check lot is active
  if (lot.status !== 'active') {
    return { valid: false, error: 'This lot is no longer active.' };
  }

  // Check squad is full
  if (team.squadSize >= settings.maxSquadSize) {
    return { valid: false, error: 'Your squad is full.' };
  }

  // Calculate minimum required bid
  const currentBid = run.currentHighestBid || lot.basePrice;
  const minBid = currentBid + settings.minIncrement;

  // Check bid amount
  if (bid.amount < minBid) {
    return { valid: false, error: `Your bid is too low. Minimum bid is ${formatCurrency(minBid)}.` };
  }

  // Check remaining purse
  const remaining = getRemainingPurse(team);
  if (bid.amount > remaining) {
    return { valid: false, error: 'Insufficient remaining purse.' };
  }

  // Check minimum squad completion
  const slotsNeeded = Math.max(0, settings.minSquadSize - team.squadSize - 1);
  const minRequiredFuture = slotsNeeded * settings.basePrice;
  if (remaining - bid.amount < minRequiredFuture) {
    return { valid: false, error: 'This bid would leave insufficient money to complete the minimum squad.' };
  }

  return { valid: true };
}
