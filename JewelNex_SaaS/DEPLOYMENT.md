# JewelNex SaaS — Production Deployment Checklist

## Overview
This document covers the complete production deployment procedure for JewelNex SaaS (Backend API + Frontend React App), including environment variables, database migration, process management, SSL, backup, and health monitoring.

---

## ✅ Pre-Deployment Requirements

| Requirement | Notes |
|---|---|
| Node.js ≥ 18 LTS | Use `nvm` or `volta` |
| MySQL 8.0+ | Remote DB at `65.108.76.42:3306` or self-hosted |
| PM2 (process manager) | `npm install -g pm2` |
| Nginx (reverse proxy) | For SSL termination and static file serving |
| Certbot / SSL cert | Let's Encrypt or wildcard cert |
| Domain name | e.g. `jewelnex.vayunexsolution.com` |

---

## 1. Environment Variables

### Backend (`backend/.env`)
```env
# Server
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL="mysql://db_user:db_password@65.108.76.42:3306/vayunexs_jewelnex"

# JWT
JWT_SECRET=<minimum_64_char_random_secret>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=https://jewelnex.vayunexsolution.com,https://app.yourdomain.com

# Email (for OTP/password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="JewelNex <no-reply@jewelnex.com>"
```

> **⚠️ CAUTION:** Never commit `.env` to version control. Use `.env.example` as a template.

### Frontend (`frontend/.env.production`)
```env
VITE_API_BASE_URL=https://jewelnex.vayunexsolution.com/api/v1
```

---

## 2. Database Setup

### 2a. Run Prisma migrations
```bash
cd backend
npx prisma db push            # Pushes schema to DB
npx prisma generate           # Regenerates Prisma client
```

### 2b. Seed Chart of Accounts
After first deploy, call the initialization endpoint once:
```bash
curl -X POST https://yourdomain.com/api/v1/accounting/initialize \
  -H "Authorization: Bearer <admin_token>"
```

### 2c. Verify stored procedures exist
```sql
SHOW PROCEDURE STATUS WHERE Db = 'vayunexs_jewelnex';
-- Should list: sp_PostInvoice, sp_ReverseInvoice
```

---

## 3. Backend Build & Process Management

```bash
# 1. Install dependencies
cd backend && npm ci

# 2. Build TypeScript
npm run build

# 3. Start with PM2
pm2 start dist/server.js --name jewelnex-api --max-memory-restart 512M

# 4. Auto-restart on reboot
pm2 save
pm2 startup
```

### PM2 ecosystem file (`ecosystem.config.js`):
```js
module.exports = {
  apps: [{
    name: 'jewelnex-api',
    script: './dist/server.js',
    instances: 2,           // cluster mode
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

---

## 4. Frontend Build & Serve

```bash
# 1. Install and build
cd frontend
npm ci
npm run build

# 2. Output is in frontend/dist/ — serve via Nginx
```

---

## 5. Nginx Configuration

```nginx
# /etc/nginx/sites-available/jewelnex

server {
    listen 80;
    server_name jewelnex.vayunexsolution.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jewelnex.vayunexsolution.com;

    ssl_certificate     /etc/letsencrypt/live/jewelnex.vayunexsolution.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jewelnex.vayunexsolution.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 256;

    # API reverse proxy
    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
    }

    # React SPA — serve static files with HTML5 history fallback
    location / {
        root   /var/www/jewelnex/frontend/dist;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable and reload
sudo ln -s /etc/nginx/sites-available/jewelnex /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d jewelnex.vayunexsolution.com
# Auto-renew
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet
```

---

## 7. Backup Strategy

### Database
```bash
# Daily backup script (/etc/cron.daily/jewelnex-backup)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/jewelnex
mkdir -p $BACKUP_DIR

mysqldump -h 65.108.76.42 -u db_user -pdb_password vayunexs_jewelnex \
  --single-transaction --quick --lock-tables=false \
  > $BACKUP_DIR/jewelnex_$DATE.sql.gz

# Retain 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Uploaded files/logs
```bash
# Sync to S3 (optional)
aws s3 sync /var/log/pm2 s3://your-bucket/jewelnex-logs/
```

---

## 8. Health Check Endpoints

| Endpoint | Expected Response |
|---|---|
| `GET /health` | `{ "status": "OK", "timestamp": "..." }` |
| `GET /api/v1` | `{ "success": true, "message": "JewelNex SaaS API v1 is running" }` |

### Uptime monitoring (recommended):
- **UptimeRobot** (free): Monitor `/health` every 5 minutes
- **PM2 Plus**: Process-level monitoring

---

## 9. Post-Deployment Verification

```bash
# 1. Verify API is live
curl https://jewelnex.vayunexsolution.com/health

# 2. Test auth login
curl -X POST https://jewelnex.vayunexsolution.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jewelnex.com","password":"Admin@123"}'

# 3. Check PM2 status
pm2 status
pm2 logs jewelnex-api --lines 50

# 4. Verify DB connection
curl https://jewelnex.vayunexsolution.com/api/v1/inventory/stats \
  -H "Authorization: Bearer <token>"
```

---

## 10. Security Hardening

- [ ] Rotate JWT_SECRET after first deployment
- [ ] Enable MySQL SSL (`?ssl-mode=REQUIRED` in DATABASE_URL)
- [ ] Set up fail2ban for brute-force protection
- [ ] Enable rate limiting (`express-rate-limit` — already installed)
- [ ] Disable MySQL remote root access
- [ ] Set `NODE_ENV=production` — disables error stack traces in API responses
- [ ] Review CORS_ORIGINS — restrict to your exact frontend domain
- [ ] Enable Nginx `server_tokens off`
- [ ] Set response headers: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options` (handled by `helmet` middleware)

---

## Branding Notice

All invoice PDFs and thermal receipts include:
> **"Powered by VayuNex Solution"**

Company logo and details are configurable at:
`/dashboard/settings` → Company Settings

---

*Deployment checklist prepared by VayuNex Solution for JewelNex SaaS v1.0 (Phase F)*
