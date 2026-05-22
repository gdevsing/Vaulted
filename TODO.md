# To-Do List

## Features & Improvements
- [ ] **App Data Entry Optimization (Sundays)**
  - Add a **"No Change"** option/button when updating weekly app data.
  - *Use Case:* Helps streamline entries for slow-moving or fixed accounts (like Superannuation) where data does not change every single week.
- [ ] **Gemini AI screenshot agent** — upload screenshot → auto-extract balance on /update page

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
- [ ] Gemini API key — add in Admin → Credentials → Gemini AI

---

## SSH Command
```bash
ssh -i ~/Documents/Vaulted/"oracle cloud keys "/ssh-key-2026-05-22\ \(3\).key ubuntu@168.138.8.134
```

## Deploy to Server
```bash
cd /home/ubuntu/vaulted && git pull origin main && npm run build && pm2 reload all
```
