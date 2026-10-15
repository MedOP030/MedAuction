# MedAuction — Every Bid. Every Team. One Platform.

A complete multi-auction management platform for medical colleges, college tournaments, student organizations, sports leagues, and competitive events.

## Features

### Core Functionality
- **Multi-Auction Management** — Create and manage multiple independent auctions
- **Role-Based Access Control** — Owners, Auctioneers, Captains, Streamers, and Spectators
- **Server-Side Bidding Engine** — Atomic bid validation with financial and squad rules
- **Real-Time Updates** — Live bid tracking and synchronized displays
- **Practice & Official Modes** — Separate runs with independent data
- **Financial Tracking** — Automatic purse management and squad limits
- **Reports & Exports** — CSV export, printable reports, action history

### Workspaces
- **Owner Dashboard** — Create, configure, and manage auctions
- **Auctioneer Workspace** — Live auction control with manual bid entry
- **Captain Interface** — Bidding controls with real-time validation
- **Streamer Controls** — Multiple display layouts for projection
- **Spectator View** — Public read-only auction viewing
- **Projector Display** — Full-screen auction display

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- Zustand (state management)
- UUID (unique identifiers)

### Backend (Production)
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Row Level Security (RLS) policies
- Database functions for atomic operations

### Current Implementation
The current deployment uses client-side state management with localStorage persistence, simulating the full architecture. For production use with Supabase, see the deployment section below.

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

## Usage

### First Time Setup
1. Open the application in your browser
2. Click "Get Started" or "Create Account"
3. Register with your name, email, and password
4. You'll be taken to your dashboard

### Creating an Auction
1. Click "New Auction" on the dashboard
2. Fill in auction details (name, category, date)
3. Configure rules (purse, base price, squad limits)
4. Add teams with names and colors
5. Add lots (players/items) with base prices
6. Send invitations to participants
7. Click "Go Live" to start the auction

### Running an Auction
1. **Auctioneer** opens the Auctioneer Workspace
2. Click "Start Next Lot" to begin each lot
3. **Captains** place bids from their workspace
4. Auctioneer marks lots as SOLD or UNSOLD
5. Use Pause/Resume as needed
6. View Reports for final results

### Demo Data
Click "Load Demo Data" on the dashboard to create a sample auction with:
- 4 teams
- 12 cricket players
- Pre-configured rules

## Auction Rules

### Default Configuration
| Setting | Default |
|---------|---------|
| Team Purse | ₹20,000 |
| Base Price | ₹200 |
| Min Increment | ₹200 |
| Min Squad Size | 6 |
| Max Squad Size | 8 |
| Quick Bid Buttons | ₹200, ₹500, ₹1,000, ₹2,000 |
| Currency | INR |

### Bid Validation Rules
Every bid is validated against:
1. User authentication and authorization
2. Auction is accepting bids (active, not paused)
3. Lot is currently active
4. Team is not already leading
5. Bid meets minimum increment requirements
6. Team has sufficient remaining purse
7. Team has not reached maximum squad size
8. Bid doesn't prevent completing minimum squad at base price

### Financial Calculations
- Remaining Purse = Initial Purse − Total Committed Purchases
- Available Slots = Max Squad Size − Current Squad Size
- Min Required Future Spending = Slots Needed × Base Price
- Max Permitted Bid = Remaining Purse − Min Required Future Spending

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Owner** | Full auction management, create/edit/delete, invitations, reports |
| **Auctioneer** | Start lots, enter bids, mark SOLD/UNSOLD, pause/resume, undo |
| **Captain** | View team info, place bids, view purchases |
| **Streamer** | Select projector layouts, control displays |
| **Spectator** | View public auction information (read-only) |

## Auction Lifecycle

```
Draft → Upcoming → Live → Paused ↔ Live → Completed → Archived
```

- **Draft**: Configuration phase
- **Upcoming**: Scheduled but not yet started
- **Live**: Accepting bids
- **Paused**: Temporarily stopped (preserves state)
- **Completed**: Finalized, results preserved
- **Archived**: Hidden from active views

## Deployment

### Static Frontend (Current)
The application can be deployed to any static hosting service:
- Cloudflare Pages
- Vercel
- Netlify
- GitHub Pages

```bash
npm run build
# Deploy the dist/ directory
```

### Full Stack (Production)
For production with Supabase:
1. Create a Supabase project
2. Apply database migrations
3. Enable Row Level Security
4. Configure authentication
5. Set environment variables
6. Deploy frontend

See `.env.example` for required variables.

## Security

### Current Implementation
- Passwords stored in client-side state (demo only)
- Role validation in application logic
- Bid validation with all financial rules

### Production Requirements
- Supabase Authentication (bcrypt password hashing)
- Row Level Security on all tables
- Database functions for atomic bid operations
- No secret keys in frontend code
- Secure session management (httpOnly cookies)

## Known Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | Demo | Uses localStorage; Supabase needed for production |
| Real-time Updates | Simulated | State updates immediately; Supabase Realtime needed for multi-user |
| Server-side Validation | Client-side | All rules implemented; needs database functions for production |
| Photo Uploads | Not implemented | Requires Supabase Storage configuration |
| Email Invitations | Link-based | Token URLs generated; email delivery needs configuration |
| PDF Export | Not implemented | CSV export available; PDF requires additional library |
| Countdown Timer | Configurable | Client-side timer; server authority needed for production |
| Concurrent Bids | Sequential | Transaction safety designed; needs database implementation |

## Project Structure

```
src/
├── App.tsx              # Main app with routing
├── store.ts             # Zustand state management
├── types.ts             # TypeScript types and helpers
├── index.css            # Tailwind CSS and custom styles
├── main.tsx             # Entry point
└── pages/
    ├── Landing.tsx      # Public landing page
    ├── Login.tsx        # Login form
    ├── Register.tsx     # Registration form
    ├── Dashboard.tsx    # Main user dashboard
    ├── AuctionSetup.tsx # Auction configuration
    ├── AuctioneerWorkspace.tsx  # Live auction control
    ├── CaptainWorkspace.tsx     # Team captain bidding
    ├── StreamerView.tsx         # Streamer controls
    ├── SpectatorView.tsx        # Public spectator view
    ├── Reports.tsx      # Results and exports
    ├── Invitations.tsx  # Invitation management
    └── ProjectorView.tsx # Full-screen projector
```

## License

This project is built for educational and competitive event management purposes.

---

**MedAuction** — Every Bid. Every Team. One Platform.
