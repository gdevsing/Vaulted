# To-Do List

## Features & Improvements
- [ ] **App Data Entry Optimization (Sundays)**
  - Add a **"No Change"** option/button when updating weekly app data.
  - *Use Case:* Helps streamline entries for slow-moving or fixed accounts (like Superannuation) where data does not change every single week.

---

## Production Checklist — Do These In Order

**Server:** `168.138.8.134` (Ubuntu 22.04)
**Domain:** `vaulted.gdevsingh.com` (DNS live, HTTP working)
**SSH:** `ssh -i ~/Documents/Vaulted/"oracle cloud keys "/ssh-key-2026-05-22\ \(3\).key ubuntu@168.138.8.134`

### Step 1 — HTTPS (certbot) — on server
```bash
sudo certbot --nginx -d vaulted.gdevsingh.com
```

### Step 2 — Deploy auth fix — on Mac
Code changes made locally (not yet on server):
- `app/api/login/route.js` — new API that validates password against DB
- `app/login/page.js` — login now calls /api/login instead of mock check

Deploy via:
```bash
cd ~/Documents/Vaulted/Vaulted
git add .
git commit --no-gpg-sign -m "feat: real password auth via /api/login"
git push origin main
```
Then on server:
```bash
cd /home/ubuntu/vaulted
git pull origin main
npm install
npm run build
pm2 reload all
```

### Step 3 — Set app password
Go to https://vaulted.gdevsingh.com/admin → Credentials → App Settings
- Set `Login Password` to a strong password
- Set `App URL` to `https://vaulted.gdevsingh.com`
- Hit Save

### Step 4 — Add Gemini API key
Go to https://aistudio.google.com/apikey → Create API key
Then paste into Admin → Credentials → Gemini AI → API Key → Save

### Step 5 — Google Drive backup (optional)
- Create a Google service account at console.cloud.google.com
- Paste JSON token into Admin → Credentials → Google Drive Backup
- Paste Drive folder ID
