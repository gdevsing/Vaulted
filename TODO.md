# To-Do List

## Features & Improvements

Nothing pending — all features shipped. ✓

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

## Cron & App URL fixes (pending — do not merge without testing)

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

### Fix 1 — Call ntfy.sh directly from cron (remove API dependency)

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

### Fix 2 — Split app_url into two settings

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

