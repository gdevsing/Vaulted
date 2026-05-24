# CLAUDE.md — Vaulted

This file tells Claude everything it needs to know about this project.
Read this at the start of every session.

---

## ⚠️ Working Rules

1. **Never push code without approval.** Always explain what you plan to change and why, then wait for the go-ahead before implementing or pushing anything.
2. **Never implement without discussing first.** Diagnose and propose — then wait.
3. **After every code change, check all docs.** Before committing, review README.md, DEPLOY.md, ARCHITECTURE.md, TODO.md and CLAUDE.md. Update any that are stale, incorrect or missing context about the change. This is mandatory — not optional.

---

## What is Vaulted?

A personal net worth tracker for two people (husband + wife + joint, single shared login).
Tracks 10 accounts across cash, shares, crypto, and super.
Hosted on Oracle Cloud Always Free. Total ongoing cost: $0.
Live at: https://your-domain.com

---

## Stack

| Layer         | Tech                          | Notes                                      |
|---------------|-------------------------------|---------------------------------------------|
| Framework     | Next.js 14 (App Router)       | Frontend + backend in one codebase          |
| Frontend      | React (JSX, "use client")     | All pages in app/                           |
| Backend       | Next.js API Routes (Node.js)  | All endpoints in app/api/                   |
| Database      | SQLite via @libsql/client     | vaulted.db on VPS, no native build needed   |
| AI Vision     | Google Gemini 2.5 Flash       | Reads balances from screenshots             |
| FX Rates      | frankfurter.app               | Free, no API key, cached 24h in DB          |
| Notifications | ntfy.sh                       | Push reminders, topic in settings           |
| Hosting       | Oracle Cloud Always Free VPS  | Ubuntu, PM2, Nginx, Let's Encrypt           |
| Backups       | GitHub private repo           | Weekly Monday cron → push vaulted.db        |
| CI/CD         | GitHub Actions                | Auto-deploys on every merge to main         |
| Licence       | MIT                           | © 2026 Gurdev Singh                         |

---

## Accounts

| Account       | Owner | Asset  | Currency | Frequency   |
|---------------|-------|--------|----------|-------------|
| Up Bank       | H     | Cash   | AUD      | Weekly      |
| NAB Everyday  | H     | Cash   | AUD      | Weekly      |
| ANZ Savings   | H     | Cash   | AUD      | Weekly      |
| ING Orange    | H     | Cash   | AUD      | Weekly      |
| Stake ASX     | H     | Shares | AUD      | Fortnightly |
| Stake Wall St | H     | Shares | USD      | Fortnightly |
| Spaceship     | H     | Shares | AUD      | Monthly     |
| Swyftx        | H     | Crypto | AUD      | Weekly      |
| Husband Super | H     | Super  | AUD      | Monthly     |
| Wife Super    | W     | Super  | AUD      | Monthly     |

Owner types: H (Husband), W (Wife), J (Joint)

---

## Credentials & Config

All stored in the SQLite `settings` table. Configurable via **Admin → Credentials** tab.
Never stored in .env files or committed to git.

| Setting key    | What it is                          | Notes                                   |
|----------------|-------------------------------------|-----------------------------------------|
| gemini_api_key | Google Gemini API key               | https://aistudio.google.com/apikey      |
| gemini_model   | Model string                        | gemini-2.5-flash                        |
| ntfy_topic     | ntfy.sh notification topic          | Create at https://ntfy.sh               |
| ntfy_server    | ntfy server URL                     | Default: https://ntfy.sh                |
| ntfy_password  | ntfy password (private topics only) | Optional                                |
| app_public_url | Public URL of the deployed app      | https://your-domain.com           |
| app_password   | Login password for the app          | Set in Admin → Credentials              |

---

## API Routes

| Method             | Endpoint              | What it does                        |
|--------------------|-----------------------|-------------------------------------|
| GET                | /api/accounts         | List all active accounts            |
| POST               | /api/accounts         | Create new account                  |
| GET/PATCH/DELETE   | /api/accounts/[id]    | Single account CRUD                 |
| GET                | /api/snapshots        | Balance history for an account      |
| POST               | /api/snapshots        | Save a new balance snapshot         |
| GET                | /api/networth         | Current totals + asset breakdown    |
| GET                | /api/networth?history | Weekly net worth history            |
| GET                | /api/fx               | Live FX rate (USD→AUD), 24h cached  |
| GET/PATCH          | /api/settings         | App config read/write               |
| POST               | /api/login            | Auth — compare password, set cookie |
| POST               | /api/logout           | Clear session cookie                |
| POST               | /api/gemini           | Screenshot → balance via Gemini AI  |
| POST               | /api/notify           | Send ntfy.sh push notification      |
| GET                | /api/notify           | Notification config status          |
| POST               | /api/run-job          | Manually trigger a cron job         |

---

## Pages

| Route        | File                      | Notes                              |
|--------------|---------------------------|------------------------------------|
| /login       | app/login/page.js         | Rotating quotes, MIT footer        |
| /dashboard   | app/dashboard/page.js     | Net worth, donut, account cards    |
| /update      | app/update/page.js        | Guided sync, Gemini AI, no-change  |
| /trends      | app/trends/page.js        | Charts, time filters, breakdown    |
| /milestones  | app/milestones/page.js    | Goals, projections, achievements   |
| /admin       | app/admin/page.js         | Accounts + credentials + cron jobs |

---

## Key Files

| File                            | Purpose                                      |
|---------------------------------|----------------------------------------------|
| lib/db.js                       | SQLite client, schema, seed, getSetting      |
| lib/api.js                      | Fetch wrappers (all cache: no-store)         |
| lib/tokens.js                   | Design tokens (colours, fonts)               |
| lib/utils.js                    | fmt, fmtShort, daysAgo, projectNetWorth      |
| middleware.js                   | Route protection via session cookie          |
| scripts/cron.js                 | Cron scheduler (3 jobs)                      |
| ecosystem.config.cjs            | PM2 config for vaulted + vaulted-cron        |
| .github/workflows/deploy.yml    | CI/CD auto-deploy on merge to main           |
| components/logo.jsx             | Dial mark + Audiowide wordmark               |
| components/account-card.jsx     | Account row with USD conversion display      |
| app/globals.css                 | CSS variables, dark/light themes, animations |

---

## Design Tokens

- **Background:** #0C0A08 (dark) / #F5F0E8 (light)
- **Gold accent:** #FFD24A (dark) / #B87800 (light)
- **Fonts:** Audiowide (display), JetBrains Mono (UI/data), Cormorant Garamond (accents)
- **Cards:** border-radius 3px 14px 14px 3px, frosted glass
- **Asset colours:** Cash #60A5FA · Shares #4ADE80 · Crypto #C084FC · Super #FB923C

---

## Git Conventions

- Branch from main, never commit directly to main
- Branch names: feat/*, fix/*, chore/*
- Commit format: `type: short description`
- Always: `git commit --no-gpg-sign`
- Always: `Co-Authored-By: Claude claude-sonnet <claude@anthropic.com>`

---

## Build / Run

```bash
npm install
npm run dev      # localhost:3000
npm run build    # production build
npm run start    # production server (on VPS with PM2)
```

---

## Current Status

All features built and deployed at https://your-domain.com

### Completed
- ✅ All 6 screens (login, dashboard, update, trends, milestones, admin)
- ✅ SQLite backend with full API routes
- ✅ Gemini 2.5 Flash screenshot extraction
- ✅ ntfy.sh push notifications (Sunday 9am AEST, no net worth in message)
- ✅ FX rate caching — frankfurter.app direct call from cron (6am AEST)
- ✅ Cron notification — ntfy.sh direct call (no auth middleware dependency)
- ✅ GitHub private repo DB backup (Monday 2am)
- ✅ Session auth + middleware route protection + logout
- ✅ Joint owner type (H/W/J)
- ✅ No Change tab on update flow
- ✅ Show all accounts toggle
- ✅ Logo animation on login
- ✅ Oracle Cloud deployment (PM2 + Nginx + Let's Encrypt)
- ✅ CI/CD via GitHub Actions (secrets configured, auto-deploys on merge)
- ✅ Rotating finance quotes on login with fade-in animation
- ✅ MIT licence + © 2026 Gurdev Singh footer
- ✅ Stale state fix — cache: no-store on all GET fetches
- ✅ router.refresh() after account deletion
- ✅ USD balance colour fix (readable in dark mode)
- ✅ FX cron calls frankfurter.app directly (no longer depends on Next.js being up)
- ✅ Balance save error handling (shows error instead of fake SAVED ✓)
- ✅ Cron job manual trigger + status panel in Admin

### Pending
- [ ] Auth hardening with bcrypt (current: plaintext compare against DB)

---

## Due Date Logic

Accounts become due based on the `notify_day` setting (default: Sunday). 
Logic lives in `app/update/page.js` (`isDue()`) and is mirrored in `scripts/cron.js`.

| Frequency | Due when |
|---|---|
| Weekly | Every Sunday — overdue if last sync > 7 days ago |
| Fortnightly | The Sunday that falls 14+ days after last sync date |
| Monthly | First Sunday of the current calendar month |

Each account card in the sync flow shows:
- `weekly · Due now` — if overdue
- `weekly · Due this Sunday` — if today is Sunday and not yet synced
- `fortnightly · Due in 2wk` — upcoming due date
- `monthly · Due 1 Jun` — first Sunday of next month

The DUE | ALL pill on the sync screen filters using this logic.
DUE = default, shows only accounts where `isDue()` returns true.
ALL = shows every account regardless of schedule.

