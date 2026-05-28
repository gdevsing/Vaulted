# To-Do List

## Features & Improvements

### Near-Term Hardening
- [ ] Next.js 14 → 16 upgrade — **now more urgent** (May 6 2026 batch of 12 CVEs; no 14.x patches planned). See Maintenance section for steps. Low operational risk for Vaulted (no middleware routing, i18n, or SSRF surface) but no future patches on 14.x.
- [x] Audit all cron jobs — confirmed none call `/api/*` internally (all 3 jobs call external services directly)

### Nice to Have
- [ ] Add `/api/health` endpoint (no auth required) for uptime monitoring
- [ ] Biometric lock (WebAuthn) — Face ID / fingerprint to lock app without ending session. Works on Android PWA (Chrome) and iOS PWA (Safari, iOS 16+). Falls back to app password after 3 failed attempts.
- [ ] `backup_filename` consistency — cron `backupDb()` hardcodes `"vaulted-backup.db"` instead of reading `backup_filename` from DB settings like the restore endpoint does. Change the filename in Admin and the restore/backup would be out of sync.

### Shipped ✓
- [x] DB restore in Admin — GitHub backup pull (reads repo/token/filename from settings dynamically) + manual `.db` upload fallback (PR #78)
- [x] Trends + Goals page sizing — fonts and padding reduced to match dashboard density, float precision bug fixed (PR #83)
- [x] Mobile nav sticky — `.page` padding split into individual properties so inline `paddingTop` can no longer clobber `padding-bottom`; bottom nav `width: 100%` + `overflow: hidden` (PR #86)
- [x] Goals page horizontal overflow + zoom — projection cards `minWidth: 0`, GoalBar overflow contained, float precision fixed (PR #87)
- [x] Logo needle standardised to 10pm — static needle at correct coords, animated version wraps in `<g>` to avoid angle compounding, splash replaced rAF/setState loop with pure CSS animation (PR #89 + hotfix #90)
- [x] Asset type filter on dashboard — ALL / CASH / SHARES / CRYPTO / SUPER pills, client-side filtering of accounts + totals + donut, FILTERED badge on hero, localStorage persistence
- [x] Post-deploy cleanup — `app_password_mock` cleared, `smoke-test.js` removed

---

## Maintenance

### Next.js 14 → 16 Upgrade
Current: `next@14.2.35` — **no longer receiving security patches**. On May 6 2026, 12 new CVEs were disclosed (middleware bypass, XSS, SSRF, cache poisoning, DoS). Patches landed in 15.5.18+ and 16.2.6+. The 14.x line will not be patched.

Operational risk for Vaulted is low (no middleware routing, i18n, rewrites, or image optimisation in use) but staying on 14.x means no future security fixes. Recommended upgrade path: 14.x → 15.x first, then 16.x.

**When ready:**
1. Create a branch `chore/nextjs-16-upgrade`
2. Run `npm install next@latest react@latest react-dom@latest`
3. Test all pages locally (`npm run dev`)
4. Fix any breaking changes (App Router API changes, middleware changes)
5. Run `npm run build` — confirm clean
6. Deploy and verify prod

---

## Production Setup — Completed ✓
- [x] Oracle VM + SSH
- [x] Node, PM2, Nginx installed
- [x] Repo cloned + built on server
- [x] HTTPS via Let's Encrypt (auto-renews)
- [x] DNS — your-domain.com → your-vps-ip
- [x] Session cookie auth + middleware route protection
- [x] Logout button
- [x] app_password set in Admin → Credentials
- [x] app_url set to https://your-domain.com
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
- [x] Mock password removed from production
- [x] smoke-test.js removed
- [x] DB restore in Admin panel (GitHub pull + manual upload, double-auth protected)

---

## SSH Command
```bash
ssh -i /path/to/your/ssh-key.key ubuntu@your-vps-ip
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

---

## Cron & App URL fixes ✅ DONE

### Background
The weekly notification cron was failing at 9am Sunday with:
`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

Root cause: the `app_url` setting was changed from `http://localhost:3000` to the
public domain (e.g. `https://your-domain.com`). The cron calls `${app_url}/api/notify`
which routes through Nginx → auth middleware → redirect to /login → HTML returned → JSON parse fails.

The Run Now button works because it's called from the browser with a valid session cookie.
The cron has no cookie so middleware blocks it.

**Immediate fix (already done):** Change `app_url` back to `http://localhost:3000` in
Admin → Credentials → App Settings.

### ✅ Fix 1 — Call ntfy.sh directly from cron (done)

In `scripts/cron.js`, update `sendWeeklyNotification()` to:
- Read `ntfy_topic`, `ntfy_server`, `ntfy_password` directly from SQLite
- Build the weekly summary (accounts due count) from SQLite directly
- POST to ntfy.sh directly — same pattern as `refreshFxRate()` calling frankfurter.app

This removes the cron's dependency on Next.js being reachable at all.

```js
async function sendWeeklyNotification() {
  const topic    = await getSetting("ntfy_topic");
  const server   = await getSetting("ntfy_server") || "https://ntfy.sh";
  const password = await getSetting("ntfy_password");

  // Build summary from DB directly
  const { rows } = await db.execute("SELECT name, frequency, updated FROM accounts WHERE active = 1");
  const due = rows.filter(a => {
    const days = Math.floor((Date.now() - new Date(a.updated)) / 86400000);
    const limits = { weekly: 8, fortnightly: 16, monthly: 33 };
    return days >= (limits[a.frequency] || 33);
  });

  const message = due.length > 0
    ? `${due.length} account${due.length > 1 ? "s" : ""} to sync · Tap to open Vaulted`
    : "All accounts up to date · Tap to open Vaulted";

  const headers = {
    "Content-Type": "text/plain",
    "Title": "Time to sync your vault",
    "Priority": due.length > 0 ? "high" : "default",
    "Tags": "money_with_wings",
  };
  if (password) headers["Authorization"] = "Bearer " + password;

  await fetch(`${server}/${topic}`, { method: "POST", headers, body: message });
  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)",
    args: ["last_notified", new Date().toISOString()],
  });
}
```

### ✅ Fix 2 — Split app_url (done — app_url removed, app_public_url used)

The `app_url` setting is doing double duty:
- External: used in notification messages, ntfy subscribe URL display
- Internal: used by cron to call the API (wrong — should always be localhost)

Add a second setting `app_internal_url` defaulting to `http://localhost:3000`.

In `lib/db.js` initDb(), add:
```js
('app_internal_url', 'http://localhost:3000'),
```

Update `scripts/cron.js` `getAppUrl()` to use `app_internal_url`:
```js
async function getAppUrl() {
  return (await getSetting("app_internal_url")) || "http://localhost:3000";
}
```

Add the field to Admin → Credentials → App Settings group in `app/admin/page.js`:
```js
{ key: "app_internal_url", label: "Internal URL (cron)", secret: false, placeholder: "http://localhost:3000" },
```

Note: After Fix 1 is done, the cron won't need `app_internal_url` for notifications
or FX (both call external services directly). It may still be needed for any future
jobs that need to call the app API.


---

## Security Headers (Grade F → A) ✅ DONE

Current score: **F** — all 6 security headers missing.
Tested at: https://securityheaders.com/?q=https://your-domain.com

All fixes are in **Nginx config only** — no code changes needed.

### Step 1 — SSH into VPS and edit Nginx config

```bash
sudo nano /etc/nginx/sites-available/vaulted
```

### Step 2 — Add these headers inside the `server` block

```nginx
# ── Security headers ──────────────────────────────────────────────
# Forces HTTPS for 1 year
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Prevents XSS attacks by whitelisting content sources
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' fonts.googleapis.com fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none';" always;

# Prevents clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevents MIME sniffing
add_header X-Content-Type-Options "nosniff" always;

# Controls referrer information sent with requests
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Disables unused browser features
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

# ── Hide server info ───────────────────────────────────────────────
# Hides nginx version and OS from attackers
server_tokens off;
```

### Step 3 — Also add to http block in nginx.conf to hide X-Powered-By

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside the `http {}` block:
```nginx
more_clear_headers 'X-Powered-By';
```

Or simpler — add to Next.js `next.config.js`:
```js
const nextConfig = {
  poweredByHeader: false,
};
module.exports = nextConfig;
```

### Step 4 — Test and reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5 — Verify

Re-run: https://securityheaders.com/?q=https://your-domain.com
Target grade: **A** or **A+**

### Notes
- CSP uses `unsafe-inline` because Next.js injects inline scripts — this is normal for Next.js apps
- `unsafe-eval` may be needed for some chart libraries (recharts) — remove if score allows
- The `X-Powered-By: Next.js` header is best removed via `next.config.js` (see Step 3)

---

## Security Hardening — Top 3 High Priority

### Fix 1 — Rate limiting on login (Nginx) ✅ DONE

Without this, anyone can hammer `/api/login` with unlimited password attempts.

SSH into VPS and edit Nginx config:
```bash
sudo nano /etc/nginx/sites-available/vaulted
```

Add rate limit zone at the top of the file (outside server block):
```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

Add inside the `server` block, before the main `location /` block:
```nginx
location /api/login {
    limit_req zone=login burst=3 nodelay;
    limit_req_status 429;
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

This allows max 5 login attempts per minute per IP, with a burst of 3.
After that, returns 429 Too Many Requests.

Test and reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

### Fix 2 — Session cookie expiry ✅ DONE

Currently the `vaulted_auth` cookie lives forever. Add a 7 day expiry.

In `app/api/login/route.js`, update the cookie:
```js
res.cookies.set("vaulted_auth", "1", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
});
```

Also add `secure: true` so the cookie is only sent over HTTPS.

---

### Fix 3 — Protect API routes from unauthenticated access ✅ DONE

Currently `middleware.js` exempts all `/api/*` routes, meaning anyone
can call `/api/accounts`, `/api/networth` etc without a session cookie.

Update `middleware.js` to protect data API routes, only exempting
auth-related endpoints:

```js
import { NextResponse } from "next/server";

// Routes that don't need auth
const PUBLIC_ROUTES = [
  "/login",
  "/api/login",
  "/api/logout",
  "/api/verify-password",
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Everything else requires auth cookie
  const auth = request.cookies.get("vaulted_auth");
  if (!auth) {
    // API calls get 401, page requests get redirected
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
```

Note: after this change, the cron job calling `/api/notify` internally
will also be blocked. This is fine since we already fixed the cron to
call ntfy.sh directly (no API hop needed). Verify all cron jobs call
external services directly before applying this fix.

---

## PWA Install Instructions

### Android (Chrome)
1. Open Chrome → visit your app URL
2. Chrome shows "Add to Home Screen" banner — tap it
3. Or: tap ⋮ menu → "Install app"
4. App icon appears on home screen, opens full screen

### iOS (Safari only)
1. Open Safari (not Chrome) → visit your app URL
2. Tap the Share button (box with arrow at bottom)
3. Tap "Add to Home Screen"
4. Tap Add
5. App icon appears on home screen, opens full screen

Note: ntfy.sh notifications work via the ntfy app — not browser push.
This is fine and already configured.

---

## VPS Prerequisites for CI/CD Pipeline

Before the auto-rollback deploy pipeline works correctly, ensure these are installed on the VPS:

```bash
# sqlite3 CLI — needed to read ntfy settings from DB in deploy script
sudo apt-get install -y sqlite3

# Verify it works
sqlite3 /home/ubuntu/vaulted/vaulted.db "SELECT value FROM settings WHERE key='ntfy_topic';"
```

---

## Deploy Pipeline Flow

```
Push to main
  └─ GitHub Actions triggers
      ├─ Save current commit hash (for rollback)
      ├─ git pull + npm install + npm build
      ├─ Pre-restart smoke tests (against old running app)
      │   └─ FAIL → revert build + notify via ntfy + exit 1
      ├─ pm2 restart vaulted vaulted-cron
      ├─ Wait 8 seconds
      ├─ Post-restart smoke tests (against new running app)
      │   └─ FAIL → git checkout prev commit + rebuild + restart + notify via ntfy + exit 1
      └─ SUCCESS → notify via ntfy "Deploy successful. Commit abc1234 live."
```

You receive an ntfy notification for:
- ✅ Successful deploy (default priority)
- ⚠ Deploy aborted — smoke tests failed before restart (high priority)
- 🔄 Deploy failed + rolled back (high priority)

---

## Upcoming Features

- [ ] **Forecast graph** *(Trends)* — project net worth forward as a dashed line from the last data point
  - Calculate average weekly/monthly gain from snapshot history
  - Extend chart timeline 12–24 months with projected values
  - Render projection as dashed line in amber to differentiate from actual data
  - Tooltip on hover showing projected value + date
  - Optional: custom monthly savings rate override
  - Feeds into the monthly savings rate card (see below)

- [ ] **Account filtering — institution** *(Dashboard)* — filter by institution (deferred; owner + asset filters shipped)

- [x] **Monthly savings rate** *(Trends)* — "Monthly Avg" stat pill showing avg monthly savings from snapshot history, with ▲/▼ improving/slowing trend indicator vs prior period
