# CLAUDE.md — Vaulted

This file tells Claude everything it needs to know about this project.
Read this at the start of every session.

---

## What is Vaulted?

A personal net worth tracker for two people (husband + wife, single shared login).
Tracks 10 accounts across cash, shares, crypto, and super.
Hosted on Oracle Cloud Always Free. Total ongoing cost: $0.

---

## Stack

| Layer       | Tech                          | Notes                                      |
|-------------|-------------------------------|--------------------------------------------|
| Framework   | Next.js 14 (App Router)       | Frontend + backend in one codebase         |
| Frontend    | React (JSX, "use client")     | All pages in app/                          |
| Backend     | Next.js API Routes (Node.js)  | All endpoints in app/api/                  |
| Database    | SQLite via @libsql/client     | vaulted.db on VPS, no native build needed  |
| AI Vision   | Google Gemini 2.5 Flash       | Reads balances from screenshots            |
| FX Rates    | frankfurter.app               | Free, no API key, cached 24h in DB         |
| Notifications | ntfy.sh                     | Push reminders, topic in settings          |
| Hosting     | Oracle Cloud Always Free VPS  | Ubuntu, PM2, Nginx, Let's Encrypt          |
| Backups     | Google Drive                  | Daily cron → upload vaulted.db             |

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

---

## Credentials & Config

All stored in the SQLite `settings` table. Configurable via **Admin → Credentials** tab.
Never stored in .env files or committed to git.

| Setting key       | What it is                          | Where to get it                          |
|-------------------|-------------------------------------|------------------------------------------|
| gemini_api_key    | Google Gemini API key               | https://aistudio.google.com/apikey       |
| gemini_model      | Model string                        | Default: gemini-2.5-flash-preview-04-17  |
| ntfy_topic        | ntfy.sh notification topic          | Create at https://ntfy.sh                |
| ntfy_server       | ntfy server URL                     | Default: https://ntfy.sh                 |
| ntfy_password     | ntfy password (private topics only) | Optional                                  |
| gdrive_token      | Google service account JSON token   | https://console.cloud.google.com         |
| gdrive_folder_id  | Google Drive folder ID for backups  | From Drive folder URL                    |
| app_url           | Public URL of the deployed app      | e.g. https://vaulted.yourdomain.com      |
| app_password      | Login password for the app          | Set on first deploy                      |

To check what's configured: **Admin → Credentials** tab.
Green dot = key is set. Missing dot = not yet configured.

---

## API Routes

| Method        | Endpoint                  | What it does                              |
|---------------|---------------------------|-------------------------------------------|
| GET           | /api/accounts             | List all active accounts                  |
| POST          | /api/accounts             | Create new account                        |
| GET           | /api/accounts/[id]        | Single account                            |
| PATCH         | /api/accounts/[id]        | Update account fields                     |
| DELETE        | /api/accounts/[id]        | Soft-delete account                       |
| GET           | /api/snapshots            | Balance history for an account            |
| POST          | /api/snapshots            | Save a new balance snapshot               |
| GET           | /api/networth             | Current totals + asset breakdown          |
| GET           | /api/networth?history     | Weekly net worth history for charts       |
| GET           | /api/fx                   | Live FX rate (USD→AUD), 24h cached        |
| GET           | /api/settings             | All settings (secrets masked)             |
| PATCH         | /api/settings             | Update settings                           |

---

## Pages

| Route        | File                        | Status   |
|--------------|-----------------------------|----------|
| /login       | app/login/page.js           | ✅ done  |
| /dashboard   | app/dashboard/page.js       | ✅ done  |
| /update      | app/update/page.js          | ✅ done  |
| /trends      | app/trends/page.js          | ✅ done  |
| /milestones  | app/milestones/page.js      | ✅ done  |
| /admin       | app/admin/page.js           | ✅ done  |

---

## Key files

| File                    | Purpose                                       |
|-------------------------|-----------------------------------------------|
| lib/db.js               | SQLite client, schema, seed data, getSetting  |
| lib/api.js              | Fetch wrappers for all API routes             |
| lib/mock-data.js        | Static fallback data (used before DB is live) |
| lib/tokens.js           | Design tokens (colours, fonts)                |
| lib/utils.js            | fmt, fmtShort, daysAgo, projectNetWorth etc   |
| components/logo.jsx     | Dial mark + Audiowide wordmark                |
| components/nav.jsx      | Bottom navigation                             |
| components/account-card.jsx | Account row card component               |
| components/charts/donut.jsx | Asset allocation donut chart             |
| components/charts/sparkline.jsx | Mini sparkline chart                 |
| app/layout.js           | ThemeContext provider, root layout            |
| app/globals.css         | CSS variables, dark/light themes, animations  |

---

## Design Tokens

- **Background:** #0C0A08 (dark) / #F5F0E8 (light)
- **Gold accent:** #FFD24A (dark) / #B87800 (light)
- **Fonts:** Audiowide (display), JetBrains Mono (UI/data)
- **Cards:** border-radius 3px 14px 14px 3px, frosted glass
- **Asset colours:** Cash #60A5FA · Shares #4ADE80 · Crypto #C084FC · Super #FB923C

---

## Git conventions

- Branch from main, never commit directly to main
- Branch names: feat/*, fix/*, chore/*
- Commit format: `feat: short description\n\n- detail\n- detail`
- Always: `git commit --no-gpg-sign`
- Always: `Co-Authored-By: Claude claude-sonnet <claude@anthropic.com>`

---

## Build / run

```bash
npm install
npm run dev      # localhost:3000
npm run build    # production build
npm run start    # production server (on VPS with PM2)
```

---

## What's next

- [ ] Gemini AI integration — screenshot → balance extraction in update flow
- [ ] ntfy.sh cron job — Sunday notification trigger
- [ ] Oracle Cloud deployment — Ubuntu VPS, Nginx, PM2, Let's Encrypt
- [ ] Google Drive backup — daily cron uploads vaulted.db
- [ ] Auth hardening — replace mock login with bcrypt password check against DB
