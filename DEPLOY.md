# Deploying to Production

## Automatic Deploy (CI/CD) — preferred

Every merge to main triggers GitHub Actions which automatically:
1. SSHes into the VPS
2. Pulls latest code
3. Builds
4. Restarts PM2

**You just merge the PR. That's it.**

Watch the deploy at: **github.com/gdevsing/Vaulted → Actions tab**

> ⚠️ Requires 3 GitHub secrets to be set — see TODO.md Stage 8 if not yet configured.

---

## Manual Deploy (backup / if CI/CD is down)

### 1 — SSH into the server

```bash
ssh -i ~/Documents/Vaulted/"oracle cloud keys"/ssh-key-2026-05-22\ \(3\).key ubuntu@168.138.8.134
```

### 2 — Pull latest code and rebuild

```bash
cd /home/ubuntu/vaulted
git pull origin main
npm install
npm run build
pm2 reload all
```

### 3 — Verify it's running

```bash
pm2 status
```

Both `vaulted` and `vaulted-cron` should show `online`.

Then visit **https://vaulted.gdevsingh.com** to confirm changes are live.

---

## Troubleshooting

**View live logs:**
```bash
pm2 logs vaulted --lines 50
pm2 logs vaulted-cron --lines 50
```

**Restart from scratch:**
```bash
pm2 stop all
pm2 start ecosystem.config.cjs
```

**Nginx:**
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
```

**SSL renewal (auto but can check manually):**
```bash
sudo certbot renew --dry-run
```
