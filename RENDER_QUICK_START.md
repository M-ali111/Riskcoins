# 🚀 Quick Render Deployment Checklist

Follow these steps in order. Estimated time: 15-20 minutes.

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created (https://render.com)
- [ ] All local changes committed

---

## 📝 Quick Steps

### 1️⃣ Generate Secrets (Run Locally)
```powershell
# Generate JWT_SECRET (copy the output)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ADMIN_SECRET (copy the output)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Save these somewhere safe!

---

### 2️⃣ Create Database (Render Dashboard)
1. New + → PostgreSQL
2. Name: `riskcoins-db`
3. Plan: Free
4. Create Database
5. **Copy Internal Database URL** (starts with `postgres://`)

---

### 3️⃣ Deploy Backend (Render Dashboard)
1. New + → Web Service
2. Connect your GitHub repo
3. Configure:
   - Name: `riskcoins-backend`
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Plan: Free

4. Add Environment Variables:
   ```
   NODE_ENV = production
   PORT = 4000
   DATABASE_URL = [paste Internal Database URL from step 2]
   JWT_SECRET = [paste generated secret from step 1]
   JWT_EXPIRES_IN = 1h
   ADMIN_SECRET = [paste generated secret from step 1]
   FRONTEND_URL = [leave empty for now]
   ```

5. Create Web Service
6. Wait for deploy (~5 minutes)
7. **Copy your backend URL** (e.g., https://riskcoins-backend.onrender.com)

---

### 4️⃣ Update Frontend Config
1. Edit `frontend/config.js`:
   ```javascript
   const API_BASE = window.location.hostname === 'localhost' 
     ? "http://localhost:4000" 
     : "https://riskcoins-backend.onrender.com"; // YOUR BACKEND URL
   ```

2. Commit and push:
   ```bash
   git add frontend/config.js
   git commit -m "Update API for production"
   git push
   ```

---

### 5️⃣ Deploy Frontend (Render Dashboard)
1. New + → Static Site
2. Connect same GitHub repo
3. Configure:
   - Name: `riskcoins-frontend`
   - Root Directory: `frontend`
   - Build Command: `echo "No build needed"`
   - Publish Directory: `.`

4. Create Static Site
5. Wait for deploy (~1 minute)
6. **Copy your frontend URL** (e.g., https://riskcoins-frontend.onrender.com)

---

### 6️⃣ Update Backend CORS
1. Go to Backend Service in Render
2. Environment → Edit `FRONTEND_URL`
3. Set to your frontend URL: `https://riskcoins-frontend.onrender.com`
4. Save (backend will auto-redeploy)

---

### 7️⃣ Test Your App
1. Visit your frontend URL
2. Try signup/login
3. Create admin account: `https://your-frontend.onrender.com/admin_signup.html`

---

## 🎯 Your Live URLs

After deployment, save these:
- **Frontend**: https://riskcoins-frontend.onrender.com
- **Backend**: https://riskcoins-backend.onrender.com
- **Admin Panel**: https://riskcoins-frontend.onrender.com/admin_panel.html

---

## ⚠️ Important Notes

- **Cold Start**: App sleeps after 15 min inactivity. First request takes 30-60 seconds.
- **Database**: Free for 90 days, renewable for free.
- **Logs**: Check Render Dashboard → Logs if issues occur.

---

## 🔄 Deploy Updates

```bash
git add .
git commit -m "Your changes"
git push
# Render auto-deploys!
```

---

## 🆘 Common Issues

**Can't connect to backend?**
- Check `FRONTEND_URL` is set in backend
- Verify `config.js` has correct backend URL

**Database errors?**
- Use Internal Database URL (not External)
- Check DATABASE_URL format

**Service unavailable?**
- Wait 60 seconds (cold start)
- Check Render logs for errors

---

**Full guide**: See `RENDER_DEPLOYMENT_GUIDE.md`

Good luck! 🚀
