# Vaulted

Personal net worth tracker for two — built with Next.js, SQLite, and Gemini AI.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend | Next.js API Routes |
| Database | SQLite (better-sqlite3) |
| AI Vision | Google Gemini 2.5 Flash |
| Notifications | ntfy.sh |
| Hosting | Oracle Cloud Always Free |
| SSL | Let's Encrypt |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project structure

```
app/
  login/        # Login screen
  dashboard/    # Net worth overview
  update/       # Guided weekly update flow
  trends/       # Charts and history
  milestones/   # Goals and achievements
  admin/        # Account management
components/
  logo.jsx      # Dial mark + Audiowide wordmark
  nav.jsx       # Bottom navigation
  top-bar.jsx   # App header
  ui/           # Shared primitives
lib/
  tokens.js     # Design tokens
  mock-data.js  # Mock data (replaced by DB later)
  utils.js      # Helper functions
design/         # Wireframes and logo explorations
```

## Build order

- [x] Scaffold + design tokens + logo
- [ ] Dashboard
- [ ] Update flow
- [ ] Trends & charts
- [ ] Milestones & goals
- [ ] Admin panel
- [ ] Backend + SQLite
- [ ] Gemini AI screenshot agent
- [ ] ntfy.sh notifications
- [ ] Oracle Cloud deployment

## Design

- **Dark theme default** with light theme toggle
- **Audiowide** wordmark, **JetBrains Mono** UI, **Cormorant Garamond** accents
- Asymmetric cards (`border-radius: 3px 14px 14px 3px`)
- Gold accent `#FFD24A` (dark) / `#B87800` (light)
- Asset colours: Cash (blue), Shares (green), Crypto (purple), Super (orange)
