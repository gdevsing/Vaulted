# Roadmap

---

## Open

### Urgent
- [ ] **Next.js 14 → 16 upgrade** — 14.x received 12 CVEs in May 2026 with no patches planned. Low operational risk but no future security fixes. See upgrade steps below.

### Soon
- [ ] `/api/health` — unauthenticated endpoint returning `{ ok: true, version }` for uptime monitoring
- [ ] `backup_filename` consistency — `backupDb()` in cron hardcodes `"vaulted-backup.db"` instead of reading from DB settings. Renaming in Admin would break the backup/restore pair.

### Ideas
- [ ] Spending tracker — daily income/expenses alongside net worth
- [ ] Investment analytics — IRR, dividend tracking, fee reporting
- [ ] Retirement simulator — Monte Carlo projections, FIRE planning

---

## Upgrade guide — Next.js 14 → 16

```bash
git checkout -b chore/nextjs-16-upgrade
npm install next@latest react@latest react-dom@latest
npm run build        # fix any breaking changes
npm run dev          # test all pages
git push && open PR
```

Key breaking changes to watch: App Router behaviour changes, `headers()` / `cookies()` async API, image optimisation defaults.

---

## PWA setup

### Android
1. Open Chrome → navigate to your app URL
2. Tap ⋮ → **Add to Home Screen**
3. Vaulted appears on home screen, opens full screen

### iOS
1. Open **Safari** (not Chrome) → navigate to your app URL
2. Tap **Share** → **Add to Home Screen** → **Add**
3. Vaulted appears on home screen, opens full screen

> iOS requires Safari for PWA install. Chrome on iOS cannot add to home screen as a PWA.

### Biometric setup (per device)
1. Open Vaulted PWA → **Admin** → **Credentials** → **Biometric Lock**
2. Enter a device name (e.g. "Gurdev's Phone")
3. Tap **+ ADD** → confirm password → follow biometric prompt
4. App locks on every open from now on

---

## SSH reference

```bash
# Connect
ssh -i ~/.ssh/vaulted ubuntu@your-vps-ip

# Manual deploy
cd /home/ubuntu/vaulted
git pull origin main && npm run build && pm2 reload all

# Logs
pm2 logs vaulted
pm2 logs vaulted-cron

# DB direct access
sqlite3 /home/ubuntu/vaulted/vaulted.db
.tables
SELECT key, value FROM settings;
```
