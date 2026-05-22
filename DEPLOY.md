# Deploying to Production

## 1 — Push code to GitHub (from your Mac)

```bash
cd ~/Documents/Vaulted/Vaulted
git add .
git commit --no-gpg-sign -m "feat: your change description"
git push origin main
```

---

## 2 — SSH into the server

```bash
ssh -i ~/Documents/Vaulted/"oracle cloud keys "/ssh-key-2026-05-22\ \(3\).key ubuntu@168.138.8.134
```

---

## 3 — Pull latest code and rebuild

```bash
cd /home/ubuntu/vaulted
git pull origin main
npm install
npm run build
pm2 reload all
```

---

## 4 — Verify it's running

```bash
pm2 status
```

Both `vaulted` and `vaulted-cron` should show `online`.

Then visit **https://vaulted.gdevsingh.com** to confirm the changes are live.

---

## Troubleshooting

**View live logs:**
```bash
pm2 logs vaulted --lines 50
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
