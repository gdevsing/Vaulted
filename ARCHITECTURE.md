# Architecture

## System Diagram

```mermaid
flowchart LR
    You(["👤 You"])

    subgraph GH["GitHub"]
        main["main"]
        Actions["Actions"]
    end

    subgraph VPS["Oracle VPS · vaulted.gdevsingh.com"]
        Nginx["Nginx
:443"]
        Next["Next.js
:3000"]
        Cron["Cron"]
        DB[("SQLite")]
    end

    subgraph Ext["External Services"]
        Gemini["✦ Gemini AI"]
        FX["💱 FX Rates"]
        Ntfy["🔔 ntfy.sh"]
        Backup["☁ GH Backup"]
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
    Cron -->|"6am"| FX
    Cron -->|"Sunday 9am"| Ntfy
    Cron -->|"Monday 2am"| Backup
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
| Backups | GitHub private repo — Monday 2am cron upload |
| Cost | $0/month |
