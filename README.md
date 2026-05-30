# Vaulted

Most finance apps want access to your bank. Vaulted doesn't. You take a screenshot, AI reads the balance, your net worth updates. Everything runs on your own server and costs nothing to keep running.


## Screenshots

<table>
  <tr>
    <td align="center"><img src="screenshots/01-login.jpg" width="180"/><br/><sub>Login</sub></td>
    <td align="center"><img src="screenshots/02-dashboard.jpg" width="180"/><br/><sub>Dashboard</sub></td>
    <td align="center"><img src="screenshots/03-dashboard-accounts.jpg" width="180"/><br/><sub>Accounts</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/04-sync-manual.jpg" width="180"/><br/><sub>Manual Sync</sub></td>
    <td align="center"><img src="screenshots/05-sync-gemini.jpg" width="180"/><br/><sub>Gemini AI Extraction</sub></td>
    <td align="center"><img src="screenshots/06-sync-usd.jpg" width="180"/><br/><sub>USD Conversion</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/07-trends.jpg" width="180"/><br/><sub>Trends</sub></td>
    <td align="center"><img src="screenshots/08-milestones.jpg" width="180"/><br/><sub>Milestones</sub></td>
    <td align="center"><img src="screenshots/09-admin.jpg" width="180"/><br/><sub>Admin</sub></td>
  </tr>
</table>


Built for a household of two. Tracks cash, shares, crypto and super across any number of accounts. Supports AUD and USD. Sends a weekly push notification to your phone when it's time to sync.

Data never leaves your server. No subscriptions. No third party access to your accounts. $0/month on Oracle Cloud Always Free.

## Use cases

**Weekly balance update**
Open the app, tap through each account due for an update. Point the camera at a balance screen — Gemini AI reads the number automatically. Or type it manually. Confirm, move on. Takes under two minutes for ten accounts.

**Net worth at a glance**
The dashboard shows total household net worth, broken down by asset class (cash, shares, crypto, super) and by owner (husband, wife, joint). Filter by owner or asset type — totals and the donut chart update live. AUD-equivalent totals are calculated live using cached FX rates for USD accounts.

**Tracking over time**
Trends page shows net worth history and a forecast projection. Every time a balance is saved, a snapshot is recorded — so history builds up automatically over weeks and months.

**Milestone goals**
Set a net worth target (e.g. $500k) and watch the progress bar fill. Milestones page shows how far along you are and projects when you'll hit it based on recent growth rate.

**Overdue account alerts**
Each account has a configured update frequency (weekly, fortnightly, monthly). On the configured day (default Sunday), a push notification fires to your phone via ntfy.sh reminding you to sync.

**Multi-currency**
USD accounts store a native USD balance and an AUD-equivalent balance. The FX rate is fetched once daily and cached in the DB.

**Biometric lock**
The PWA locks on every open and whenever backgrounded. Each household member registers their own device (Face ID / fingerprint). Any registered device can unlock. Managed from Admin → Credentials → Biometric Lock.

**Admin and credentials**
All API keys (Gemini, ntfy, GitHub) are stored in the DB and editable via the Admin panel. Cron job status is visible in Admin. Any job can be triggered manually.

**Database restore**
Restore the live database from the configured GitHub backup repo with one button tap in Admin — no SSH required.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend | Next.js API Routes |
| Database | SQLite via @libsql/client |
| AI Vision | Google Gemini 2.5 Flash |
| FX Rates | frankfurter.app (cached 24h) |
| Notifications | ntfy.sh |
| Backups | GitHub private repo |
| Hosting | Oracle Cloud Always Free |
| SSL | Let's Encrypt |

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system diagram, request flow, auth flow, and infrastructure details.

```
User → Nginx (SSL) → Next.js (:3000) → SQLite
                          ├── Google Gemini (AI vision)
                          ├── frankfurter.app (FX rates)
                          ├── ntfy.sh (notifications)
                          └── GitHub private repo (backups + restore)
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

See [DEPLOY.md](DEPLOY.md) for step-by-step instructions.

## Project structure

```
app/
  login/        # Login screen
  dashboard/    # Net worth overview
  update/       # Guided weekly update flow
  trends/       # Charts and history
  milestones/   # Goals and achievements
  admin/        # Account + credential management
  api/
    webauthn/
      register/ # Multi-device biometric registration
      verify/   # Biometric unlock verification
    admin/
      restore-db/  # DB restore endpoint
    ...
components/
  lock-screen.jsx  # Biometric lock overlay (PWA only)
  logo.jsx         # Dial mark + Audiowide wordmark
  nav.jsx          # Bottom navigation + help drawer
  top-bar.jsx      # App header
  ui/              # Shared primitives
lib/
  db.js         # SQLite client, schema, seed data
  api.js        # Fetch wrappers for all API routes
  tokens.js     # Design tokens
  utils.js      # Helper functions
```

## Status

- [x] Scaffold + design tokens + logo
- [x] Dashboard with coral hero card + decorative circles
- [x] Update flow (manual + AI screenshot)
- [x] Trends & charts (coral line, forecast projection)
- [x] Milestones & goals
- [x] Admin panel
- [x] Backend + SQLite
- [x] Auth (session cookie + middleware route protection)
- [x] ntfy.sh notifications
- [x] Oracle Cloud deployment
- [x] SSL via Let's Encrypt
- [x] CI/CD GitHub Actions (auto-deploy + rollback)
- [x] Cron job status panel in Admin
- [x] GitHub private repo DB backup
- [x] DB restore in Admin
- [x] Multi-currency (AUD + USD with live FX)
- [x] Asset type + owner filters on dashboard
- [x] Configurable owner labels (Gurdev / Jasmine / Joint)
- [x] Forecast graph on Trends
- [x] Monthly savings rate stat
- [x] **Midnight Coral theme** — single permanent theme
- [x] **Biometric lock** — multi-device WebAuthn, PWA-only, locks on every open
- [x] **PWA optimised** — correct zoom on iPhone, installable on Android + iOS

## Design

- **Midnight Coral** — single permanent theme
- `#0F0F0F` base, `#1A1A1A` cards, `#FF4757` coral accent
- Hero card: `linear-gradient(135deg, #FF6B6B → #FF4757 → #C0392B)` with decorative circles
- **Audiowide** wordmark, **JetBrains Mono** UI, **Cormorant Garamond** accents
- Asymmetric cards (`border-radius: 3px 20px 20px 3px`)
- Asset colours: Cash `#60A5FA`, Shares `#4ADE80`, Crypto `#C084FC`, Super `#FB923C`
