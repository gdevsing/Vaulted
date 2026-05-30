# To-Do List

## Open Items

### Near-Term
- [ ] Next.js 14 → 16 upgrade — **now more urgent** (May 6 2026 batch of 12 CVEs; no 14.x patches planned). Low operational risk for Vaulted but no future security fixes on 14.x. See Maintenance section.
- [ ] Add `/api/health` endpoint (no auth required) for uptime monitoring
- [ ] `backup_filename` consistency — cron `backupDb()` hardcodes `"vaulted-backup.db"` instead of reading `backup_filename` from DB settings. Change the filename in Admin and restore/backup would be out of sync.

---

## Shipped ✓

### Biometric Lock
- [x] WebAuthn multi-device registration — each device registers independently with a name (e.g. "Gurdev's Phone", "Jasmine's Phone")
- [x] Per-device removal — remove individual devices or all at once from Admin → Credentials → Biometric Lock
- [x] Any registered device can unlock — verify endpoint checks assertion against all registered credentials
- [x] Locks on every open + whenever backgrounded (`visibilitychange`)
- [x] PWA-only — lock never fires in browser tab (`display-mode: standalone` check)
- [x] iOS fixes — user gesture only (no auto-prompt), correct base64url padding, `userVerification: "preferred"`

### Theme — Midnight Coral
- [x] Single permanent theme — `#0F0F0F` base, `#FF4757` coral accent, no toggle
- [x] Hero card coral gradient with decorative circles
- [x] Asset colours restored — cash blue, shares green, crypto purple, super orange
- [x] Donut chart segments correctly positioned using `transform="rotate()"`
- [x] All `theme === "dark"` conditionals removed from codebase
- [x] Help drawer + password modal always dark background
- [x] App icons regenerated with coral needle + thin proportions
- [x] manifest.json `theme_color: #FF4757`

### PWA & Mobile
- [x] iPhone PWA zoom fixed — `(hover: hover)` media query excludes touch devices from desktop zoom
- [x] Owner badges show configured names (Gurdev/Jasmine/Joint) not H/W/J
- [x] Top bar buttons — coral glowing outline, `?` quiet, `LOGOUT` prominent
- [x] Logout button lightened + coral glow

### Dashboard
- [x] Asset allocation donut chart with correct segment colours
- [x] Coral hero card — gradient, decorative circles, white text/sparkline, white progress bar
- [x] Account card coloured left borders by asset type
- [x] Owner label enrichment from settings

### Trends
- [x] Coral net worth line
- [x] Forecast dashed line in coral
- [x] Stat pills with coral left border accent

### Milestones
- [x] Hero card full coral gradient matching dashboard
- [x] White text + visible progress bar on coral background

### Admin
- [x] BiometricCard — device list, name input, per-device remove, "Remove All"
- [x] Password confirm modal dark background
- [x] Cron job status + Run Now buttons

### Infrastructure
- [x] DB restore in Admin — GitHub pull + manual upload (PR #78)
- [x] Configurable owner labels (PR #109)
- [x] Multi-currency AUD/USD with live FX

---

## Maintenance

### Next.js 14 → 16 Upgrade
Current: `next@14.2.35` — no longer receiving security patches.

**When ready:**
1. `git checkout -b chore/nextjs-16-upgrade`
2. `npm install next@latest react@latest react-dom@latest`
3. Test all pages locally
4. Fix breaking changes, run `npm run build`
5. Deploy and verify

---

## PWA Install Instructions

### Android (Chrome)
1. Open Chrome → visit your app URL
2. Tap ⋮ menu → "Install app" or banner prompt
3. App icon appears on home screen, opens full screen

### iOS (Safari only)
1. Open Safari → visit your app URL
2. Tap Share button → "Add to Home Screen" → Add
3. App icon appears on home screen, opens full screen

**Biometric setup (per device, one-time):**
1. Admin → Credentials → Biometric Lock
2. Enter a device name (e.g. "Gurdev's Phone")
3. Tap + ADD → confirm password → biometric enrollment prompt
4. Done — app locks on every open from now on

---

## SSH & Deploy

```bash
# SSH
ssh -i /path/to/key ubuntu@your-vps-ip

# Manual deploy
cd /home/ubuntu/vaulted && git pull origin main && npm run build && pm2 reload all
```
