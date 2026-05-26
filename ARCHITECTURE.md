# Architecture

## System Diagram

```mermaid
flowchart LR
    You(["👤 You"])

    subgraph GH["GitHub"]
        main["main"]
        Actions["Actions"]
        Backup["☁ Backup repo"]
    end

    subgraph VPS["Oracle VPS · your-domain.com"]
        Nginx["Nginx\n:443"]
        Next["Next.js\n:3000"]
        Cron["Cron"]
        DB[("SQLite")]
    end

    subgraph Ext["External Services"]
        Gemini["✦ Gemini AI"]
        FX["💱 FX Rates"]
        Ntfy["🔔 ntfy.sh"]
    end

    You -->|"merge PR"| main
    You -->|"HTTPS"| Nginx
    main --> Actions
    Actions -->|"SSH deploy"| Nginx
    Nginx --> Next
    Next <-->|"read / write"| DB
    Cron <-->|"read / write"| DB
    Next -->|"screenshot"| Gemini
    Next -->|"rates"| FX
    Next -->|"restore ↓"| Backup
    Cron -->|"6am"| FX
    Cron -->|"Sunday 9am"| Ntfy
    Cron -->|"Monday 2am ↑"| Backup
```

---

## Request Flow

```
User
 └─ HTTPS request → Nginx (:443)
     └─ proxy_pass → Next.js (:3000)
         ├─ middleware.js — checks vaulted_auth cookie on every request
         │   ├─ Cookie present  → allow through
         │   └─ Cookie missing  → 401 (API) or redirect to /login (page)
         ├─ Page render  → React component
         └─ API call     → API route handler
                              └─ SQLite (local DB)
                              └─ Gemini API (AI vision)
                              └─ frankfurter.app (FX rates)
                              └─ ntfy.sh (notifications)
                              └─ GitHub private repo (backup read/write)
```

---

## Deploy Flow (CI/CD)

```
Developer merges PR to main
 └─ GitHub Actions triggers
     └─ SSH into your-vps-ip
         └─ git pull origin main
         └─ npm install
         └─ npm run build
         └─ pm2 restart vaulted vaulted-cron
             └─ App live at https://your-domain.com
```

---

## Data Flow — Weekly Update

```
User opens /update
 └─ Takes screenshot of bank app
     └─ Uploads screenshot → /api/gemini
         └─ Gemini 2.5 Flash reads balance from image
             └─ Returns extracted amount + confidence
                 └─ User confirms → POST /api/snapshots
                     └─ Balance saved to SQLite
                         └─ Dashboard + trends update
```

---

## Data Flow — DB Restore

```
User opens Admin → Credentials → Restore Database

  Option A — GitHub Backup
    └─ Reads github_repo, github_token, backup_filename from SQLite settings
        └─ GET github.com/repos/{repo}/contents/{file}  (GitHub API)
            └─ Validates SQLite magic bytes
                └─ Renames live DB → vaulted.db.bak_{timestamp}
                    └─ Writes restored DB → vaulted.db
                        └─ pm2 restart vaulted (500ms delay, fire-and-forget)

  Option B — Manual Upload
    └─ User uploads .db file via browser
        └─ Validates SQLite magic bytes
            └─ Renames live DB → vaulted.db.bak_{timestamp}
                └─ Writes restored DB → vaulted.db
                    └─ pm2 restart vaulted (500ms delay, fire-and-forget)

Auth: middleware cookie check + explicit cookie check inside route handler
```

---

## Cron Jobs

```
vaulted-cron (PM2 process)
 ├─ Sunday 9:00 AM AEST   → POST ntfy.sh directly (no API hop)
 ├─ Daily  6:00 AM AEST   → GET frankfurter.app directly → cache in DB
 └─ Monday 2:00 AM AEST   → Push vaulted.db → GitHub private repo (overwrites, 1 copy kept)
```

---

## Auth Flow

```
User visits any page
 └─ middleware.js checks for "vaulted_auth" cookie
     ├─ Cookie present  → allow through
     └─ Cookie missing  → redirect to /login (page) or 401 (API)
         └─ User enters password → POST /api/login
             └─ Compared against app_password (bcrypt) in SQLite
                 ├─ Match   → set vaulted_auth cookie (7 day expiry, httpOnly, secure) → /dashboard
                 └─ No match → show error

Sensitive routes (e.g. /api/admin/restore-db) also check the cookie
directly inside the handler as defence-in-depth.
```

---

## Infrastructure

| Component | Detail |
|---|---|
| Server | Oracle Cloud Always Free — VM.Standard.E2.1.Micro |
| OS | Ubuntu 22.04 LTS |
| Location | Australia Southeast (Melbourne) |
| CPU / RAM | 1 OCPU / 1 GB |
| Storage | 45 GB block storage |
| Process manager | PM2 (auto-restart + startup on reboot) |
| Web server | Nginx (reverse proxy + SSL termination) |
| SSL | Let's Encrypt (auto-renews every 90 days) |
| Database | SQLite — `/home/ubuntu/vaulted/vaulted.db` |
| CI/CD | GitHub Actions — auto-deploys on merge to main |
| Backups | GitHub private repo — Monday 2am cron upload (single file, overwritten each week) |
| Cost | $0/month |
