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
- [x] Google Drive weekly backup configured
- [x] Gemini API key set in Admin → Credentials → Gemini AI
- [x] No Change tab on update page
- [x] Update any account any time toggle

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

## Stage 8 — CI/CD Auto-Deploy

The GitHub Actions workflow is already created (`.github/workflows/deploy.yml`).
It triggers automatically on every merge to main — no more manual SSH deploys.

You need to add 3 secrets in GitHub to activate it:

- [ ] Go to **github.com/gdevsing/Vaulted → Settings → Secrets and variables → Actions**
- [ ] Add secret: `VPS_HOST` → `168.138.8.134`
- [ ] Add secret: `VPS_USER` → `ubuntu`
- [ ] Add secret: `SSH_PRIVATE_KEY` → contents of your `.key` file in `~/Documents/Vaulted/oracle cloud keys/`
- [ ] Test by merging any PR and watching the **Actions** tab on GitHub
- [ ] Verify both processes still running after deploy: `pm2 status`
