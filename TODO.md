# To-Do List

## Features & Improvements

Nothing pending — all features shipped. ✓

---

## Production Setup — Completed ✓
- [x] Oracle VM + SSH
- [x] Node, PM2, Nginx installed
- [x] Repo cloned + built on server
- [x] HTTPS via Let's Encrypt (auto-renews)
- [x] DNS — vaulted.gdevsingh.com → 168.138.8.134
- [x] Session cookie auth + middleware route protection
- [x] Logout button
- [x] app_password set in Admin → Credentials
- [x] app_url set to https://vaulted.gdevsingh.com
- [x] GitHub private repo backup configured (switched from Google Drive)
- [x] Gemini API key set in Admin → Credentials → Gemini AI
- [x] No Change tab on update page
- [x] Update any account any time toggle
- [x] CI/CD GitHub Actions — auto-deploys on merge to main
- [x] Rotating finance quotes on login with fade-in animation
- [x] MIT licence + © 2026 Gurdev Singh footer
- [x] Stale state fix after account deletion (cache: no-store + router.refresh)
- [x] USD balance colour fix (readable in dark mode)
- [x] FX cron calls frankfurter.app directly (fixed 6am failure)
- [x] Balance save error handling (no more fake SAVED ✓)
- [x] Notification privacy fix (net worth removed from push message)

---

## SSH Command
```bash
ssh -i ~/Documents/Vaulted/"oracle cloud keys "/ssh-key-2026-05-22\ \(3\).key ubuntu@168.138.8.134
```

## Deploy to Server
```bash
cd /home/ubuntu/vaulted && git pull origin main && npm run build && pm2 reload all
```

---

## Stage 8 — CI/CD Auto-Deploy ✓

- [x] Workflow created at `.github/workflows/deploy.yml`
- [x] `VPS_HOST`, `VPS_USER`, `SSH_PRIVATE_KEY` secrets added to GitHub
- [x] Auto-deploys on every merge to main — no more manual SSH deploys
