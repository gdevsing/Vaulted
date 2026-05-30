# Vaulted

> Your household net worth. Private, self-hosted, free.

Most finance apps want access to your bank. Vaulted doesn't. You take a screenshot — AI reads the balance — your net worth updates. Everything runs on a server you own and costs nothing to keep running.

---

## What it does

Vaulted is a weekly ritual app for two. Every Sunday you open it, tap through your accounts, point your camera at each balance, and Gemini AI reads the number. Two minutes later your net worth is updated, your chart has grown, and you can see how far you are from your next milestone.

It tracks cash, shares, crypto and super across any number of accounts. It handles AUD and USD. It sends you a push notification when it's time to sync. It locks with Face ID when you put it down.

Nothing leaves your server.

---

## Screenshots

<table>
  <tr>
    <td align="center"><img src="screenshots/dashboard.jpg" width="160"/><br/><sub>Dashboard</sub></td>
    <td align="center"><img src="screenshots/sync.jpg" width="160"/><br/><sub>Weekly Sync</sub></td>
    <td align="center"><img src="screenshots/trends.jpg" width="160"/><br/><sub>Trends</sub></td>
    <td align="center"><img src="screenshots/milestones.jpg" width="160"/><br/><sub>Milestones</sub></td>
  </tr>
</table>

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | SQLite via @libsql/client |
| AI Vision | Google Gemini 2.5 Flash |
| FX Rates | frankfurter.app (cached daily) |
| Notifications | ntfy.sh |
| Backups | GitHub private repo |
| Hosting | Oracle Cloud Always Free |
| SSL | Let's Encrypt |

---

## Getting started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Default password is set on first run.

For production deployment see [DEPLOY.md](DEPLOY.md).

---

## Documentation

| Doc | Contents |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram, request flows, infra, biometric flow |
| [DESIGN.md](DESIGN.md) | Theme, typography, colour system, component patterns, button grammar |
| [ROADMAP.md](ROADMAP.md) | Open items, maintenance notes |
| [DEPLOY.md](DEPLOY.md) | Step-by-step Oracle Cloud + Nginx + PM2 setup |

---

## Project structure

```
app/
  login/          Login screen
  dashboard/      Net worth overview, donut chart, account list
  update/         Guided weekly sync flow (manual + AI screenshot)
  trends/         Net worth chart, history, forecast
  milestones/     Goal progress and projections
  admin/          Account management, credentials, cron jobs
  api/
    webauthn/     Biometric registration + verification
    admin/        DB restore
    ...

components/
  lock-screen.jsx Biometric lock overlay (PWA only)
  logo.jsx        Clock dial + VAULTED wordmark
  nav.jsx         Bottom navigation + help drawer
  top-bar.jsx     App header with ? and LOGOUT
  account-card.jsx
  charts/         Donut, sparkline, recharts wrappers
  ui/             Shared primitives

lib/
  db.js           SQLite client, schema initialisation, seed
  api.js          Fetch wrappers for all routes
  tokens.js       Design token helpers (ASSETS colour map)
  utils.js        fmt, assetLabel, ownerLabel helpers
```

---

## Principles

**Private.** No third-party can access your accounts. No OAuth. No open banking. You read the number, you type it or photograph it, it goes into your database on your machine.

**Simple.** One action per week. The app asks you to do one thing: update your balances. Everything else — charts, projections, notifications — is automatic.

**Yours.** The codebase is small enough to read in an afternoon. The database is a single file. You can SSH in and look at your data directly. There are no abstractions you don't control.
