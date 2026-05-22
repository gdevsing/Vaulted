# Vaulted

Personal net worth tracker for two — built with Next.js, SQLite, and Gemini AI.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend | Next.js API Routes |
| Database | SQLite via @libsql/client |
| AI Vision | Google Gemini 2.5 Flash |
| FX Rates | frankfurter.app (cached 24h) |
| Notifications | ntfy.sh |
| Hosting | Oracle Cloud Always Free |
| SSL | Let's Encrypt |

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system diagram, request flow, auth flow, and infrastructure details.

```
User → Nginx (SSL) → Next.js (:3000) → SQLite
                          ├── Google Gemini (AI vision)
                          ├── frankfurter.app (FX rates)
                          ├── ntfy.sh (notifications)
                          └── Google Drive (backups)
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

See [DEPLOY.md](DEPLOY.md) for step-by-step instructions.

Live at: **https://vaulted.gdevsingh.com**

## Project structure

```
app/
  login/        # Login screen
  dashboard/    # Net worth overview
  update/       # Guided weekly update flow
  trends/       # Charts and history
  milestones/   # Goals and achievements
  admin/        # Account + credential management
  api/          # All backend API routes
components/
  logo.jsx      # Dial mark + Audiowide wordmark
  nav.jsx       # Bottom navigation
  top-bar.jsx   # App header
  ui/           # Shared primitives
lib/
  db.js         # SQLite client, schema, seed data
  api.js        # Fetch wrappers for all API routes
  tokens.js     # Design tokens
  utils.js      # Helper functions
```

## Status

- [x] Scaffold + design tokens + logo
- [x] Dashboard
- [x] Update flow
- [x] Trends & charts
- [x] Milestones & goals
- [x] Admin panel
- [x] Backend + SQLite
- [x] Auth (password set via Admin → Credentials)
- [x] ntfy.sh notifications
- [x] Oracle Cloud deployment
- [x] SSL via Let's Encrypt
- [ ] Gemini AI screenshot agent
- [ ] Google Drive backup

## Design

- **Dark theme default** with light theme toggle
- **Audiowide** wordmark, **JetBrains Mono** UI, **Cormorant Garamond** accents
- Asymmetric cards (`border-radius: 3px 14px 14px 3px`)
- Gold accent `#FFD24A` (dark) / `#B87800` (light)
- Asset colours: Cash (blue), Shares (green), Crypto (purple), Super (orange)
