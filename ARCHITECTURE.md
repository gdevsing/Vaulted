# Architecture

## System Diagram

```mermaid
graph TD
    User["👤 User\nBrowser / Phone"]
    Dev["👨‍💻 Developer\nPush to main"]

    subgraph GitHub["GitHub"]
        Repo["gdevsing/Vaulted\nSource code"]
        Actions["GitHub Actions\nCI/CD Pipeline"]
    end

    subgraph Oracle["Oracle Cloud — Always Free VPS (168.138.8.134)"]
        LE["🔒 Let's Encrypt\nSSL Certificate"]
        Nginx["Nginx\nReverse Proxy :80 / :443"]
        PM2["PM2\nProcess Manager"]

        subgraph App["Next.js 14 App (:3000)"]
            Pages["Pages\n/login /dashboard /update\n/trends /milestones /admin"]
            API["API Routes\n/api/accounts /api/networth\n/api/settings /api/login\n/api/gemini /api/fx /api/notify"]
        end

        Cron["vaulted-cron\nNode-cron scheduler"]
        SQLite["🗄 SQLite\nvaulted.db"]
    end

    subgraph External["External Services"]
        Gemini["✦ Google Gemini 2.5 Flash\nAI screenshot → balance"]
        FX["💱 frankfurter.app\nUSD → AUD rates (cached 24h)"]
        Ntfy["🔔 ntfy.sh\nPush notifications"]
        GHBackup["☁ GitHub Private Repo\nWeekly DB backup (Mondays)"]
    end

    Dev -->|"merge PR"| Repo
    Repo -->|"triggers"| Actions
    Actions -->|"SSH deploy"| PM2

    User -->|"HTTPS"| Nginx
    LE -->|"TLS cert"| Nginx
    Nginx -->|"proxy_pass"| App
    PM2 -->|"manages & restarts"| App
    PM2 -->|"manages & restarts"| Cron
    Pages -->|"fetch"| API
    API -->|"reads / writes"| SQLite
    Cron -->|"reads / writes"| SQLite
    API -->|"screenshot analysis"| Gemini
    Cron -->|"exchange rates direct"| FX
    API -->|"exchange rates"| FX
    Cron -->|"weekly reminders"| Ntfy
    Cron -->|"backup vaulted.db"| GHBackup
```

---

## Request Flow

```
User
 └─ HTTPS request → Nginx (:443)
     └─ proxy_pass → Next.js (:3000)
         ├─ Page render  → React component
         └─ API call     → API route handler
                              └─ SQLite (local DB)
                              └─ Gemini API (AI vision)
                              └─ frankfurter.app (FX rates)
                              └─ ntfy.sh (notifications)
```

---

## Deploy Flow (CI/CD)

```
Developer merges PR to main
 └─ GitHub Actions triggers
     └─ SSH into 168.138.8.134
         └─ git pull origin main
         └─ npm install
         └─ npm run build
         └─ pm2 restart vaulted vaulted-cron
             └─ App live at https://vaulted.gdevsingh.com
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

## Cron Jobs

```
vaulted-cron (PM2 process)
 ├─ Sunday 9:00 AM AEST   → POST ntfy.sh ("X accounts to sync")
 ├─ Daily  6:00 AM AEST   → GET frankfurter.app → cache USD/AUD in DB
 └─ Monday 2:00 AM AEST   → Upload vaulted.db → GitHub private repo
```

---

## Auth Flow

```
User visits any page
 └─ middleware.js checks for "vaulted_auth" cookie
     ├─ Cookie present  → allow through
     └─ Cookie missing  → redirect to /login
         └─ User enters password → POST /api/login
             └─ Compared against app_password in SQLite
                 ├─ Match   → set cookie → redirect to /dashboard
                 └─ No match → show error
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
| Backups | GitHub private repo — weekly Monday upload |
| Cost | $0/month |
