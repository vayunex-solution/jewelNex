# cPanel Git & Node.js Deployment Guide (JewelNex SaaS)

Aapko cPanel par **Git Version Control** aur **Node.js Setup** karne ke liye neeche diye gaye steps follow karne honge.

---

## Part 1: Git Version Control Setup in cPanel

cPanel ke Git Version Control option ka use karke aap apne GitHub repository ko direct cPanel par pull kar sakte hain.

### Step 1: SSH Keys Configure Karein (Agar private repo hai)
1. **cPanel** par login karein.
2. Search bar me **SSH Access** type karein aur open karein.
3. **Manage SSH Keys** par click karein.
4. **Generate a New Key** par click karein.
   - **Key Name**: default (id_rsa) ya koi bhi unique name.
   - **Password**: Ek secure password dalein (ise yaad rakhein).
   - **Key Type**: RSA select karein.
   - **Key Size**: 4096.
   - Click **Generate Key**.
5. Wapas aakar private key ke samne **View/Download** par click karein aur key copy kar lein.
6. Apne GitHub repository me jayein -> **Settings** -> **Deploy Keys** -> **Add Deploy Key**.
7. cPanel se copy ki gayi public key ko wahan paste karein aur **Allow write access** ko check kar ke save kar dein.
8. cPanel me **Manage SSH Keys** me aakar key ke samne **Authorize** par zaroor click karein.

### Step 2: cPanel me Git Repository Clone Karein
1. cPanel homepage par **Git™ Version Control** open karein.
2. **Create** button par click karein.
3. **Clone URI**: Apne GitHub repository ka SSH URL dalein (e.g., `git@github.com:username/repository.git`).
4. **Repository Path**: cPanel root path jahan repo clone hoga (e.g., `repositories/jewelnex`).
5. **Display Name**: Jo name aap show karna chahte hain (e.g., `jewelnex`).
6. **Create** par click karein. Ab aapka code cPanel server par pull ho jayega.

---

## Part 2: Setup Node.js App in cPanel

cPanel me API (Backend) ko live chalane ke liye Node.js environment setup karna padta hai.

### Step 1: Node.js Application Create Karein
1. cPanel search me **Setup Node.js App** select karein.
2. **Create Application** button par click karein.
3. **Node.js Version**: Node 18 ya latest select karein.
4. **Application Mode**: **Production** select karein.
5. **Application Root**: Wo path jahan backend file deploy hui hai (Humare case me: `/home/vayunexs/api.jewelnex.vayunexsolution.com`).
6. **Application URL**: `api.jewelnex.vayunexsolution.com`.
7. **Application Startup File**: `app.js` (Humne ise setup kar diya hai, ye `dist/server.js` ko load karegi).
8. **Create** par click karein.

### Step 2: Environment Variables Set Karein
Node.js App settings screen me niche **Environment Variables** section dikhega. Wahan ek-ek karke database aur auth configurations add karein (Jaise backend/.env me thi):
- `NODE_ENV` = `production`
- `PORT` = (Khali chhod sakte hain, Passenger automatic set karega)
- `DATABASE_URL` = `mysql://vayunexs_jwl_admin:yash474800725@65.108.76.42:3306/vayunexs_jewelnex?ssl-mode=DISABLED`
- `JWT_SECRET` = `JewelNex@VayuNex_SuperSecret_2026_ChangeInProd!`
- `JWT_EXPIRES_IN` = `7d`
- `SMTP_HOST` = `mail.vayunexsolution.com`
- `SMTP_PORT` = `465`
- `SMTP_SECURE` = `true`
- `SMTP_USER` = `no-reply@vayunexsolution.com`
- `SMTP_PASS` = `yash00725`
- `SMTP_FROM` = `"VayuNex Solution <no-reply@vayunexsolution.com>"`
- `CORS_ORIGINS` = `https://app.jewelnex.vayunexsolution.com`

*Note: Environment variables save karne ke baad click **Save**.*

### Step 3: Dependencies Install Karein
1. Configuration complete hone ke baad application page par upar **Run NPM Install** button active ho jayega.
2. **Run NPM Install** par click karein taaki sub-dependencies install ho sakein.
3. Install successfully hone ke baad page par **Restart Application** par click karein.

---

## Part 3: Deploying Frontend (React Build)

Frontend (React Client) deploy karne ke liye hume simple file hosting setup chahiye hota hai:
1. Jab aap GitHub par push karenge, automatic `.cpanel.yml` trigger ho jayega aur `JewelNex_SaaS/frontend/dist` ki built files copy hokar `/home/vayunexs/app.jewelnex.vayunexsolution.com/` directory me chali jayengi.
2. Make sure cPanel me `app.jewelnex.vayunexsolution.com` subdomain ki document root directory `/home/vayunexs/app.jewelnex.vayunexsolution.com` par pointed ho.
3. Agar React App me routing handle karni hai to wahan ek `.htaccess` file zaroor upload karein. `.htaccess` file me ye content hona chahiye (taaki refresh hone par 404 page error na aaye):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Quick Workflow (How to Deploy Updates)

Har baar jab aap local system par koi change karenge to ye steps follow karein:

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```
2. **Build Backend (Optional)**:
   ```bash
   cd ../backend
   npm run build
   ```
3. **Commit & Push to GitHub**:
   ```bash
   git add .
   git commit -m "update: deployment push"
   git push origin main
   ```
4. **Pull on cPanel**:
   cPanel me **Git Version Control** par jakar apne repo ke samne **Pull** ya **Update** click karein. cPanel deploy engine automatic `.cpanel.yml` run karke frontend static files aur backend app files update kar dega!
5. **Restart Node App**:
   cPanel me **Setup Node.js App** par jayein aur app ke samne **Restart** click karein.
