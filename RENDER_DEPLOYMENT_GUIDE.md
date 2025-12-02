# 🚀 Deploy RiskCoins to Render (Free Tier)

This guide walks you through deploying your RiskCoins application to Render's free tier - completely free with no credit card required!

## 📋 Prerequisites

- GitHub account
- Your RiskCoins repository pushed to GitHub
- Render account (sign up at https://render.com)

---

## 🎯 Deployment Overview

We'll deploy:
1. **PostgreSQL Database** (Free tier - 90 days, then can be renewed)
2. **Backend API** (Node.js Web Service - Free tier)
3. **Frontend** (Static Site - Free tier)

---

## 📝 Step 1: Push Your Code to GitHub

If you haven't already:

```bash
cd c:\Users\muham\OneDrive\Desktop\trial\riskcoins
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/riskcoins.git
git push -u origin main
```

---

## 🗄️ Step 2: Create PostgreSQL Database

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign in with GitHub

2. **Create New PostgreSQL Database**
   - Click "New +" button
   - Select "PostgreSQL"

3. **Configure Database**
   - **Name**: `riskcoins-db`
   - **Database**: `riskcoins`
   - **User**: `riskcoins` (auto-generated)
   - **Region**: Select closest to you (e.g., Oregon, Frankfurt, Singapore)
   - **Plan**: Select **Free** (90 days free, renewable)

4. **Create Database**
   - Click "Create Database"
   - Wait for it to provision (takes ~1 minute)

5. **Copy Connection Details**
   - Once created, you'll see the database dashboard
   - **Important**: Copy the **Internal Database URL** (starts with `postgres://`)
   - Keep this tab open, you'll need it soon!

---

## 🔧 Step 3: Deploy Backend API

1. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"

2. **Connect Repository**
   - Select "Build and deploy from a Git repository"
   - Click "Connect" next to your GitHub account
   - Select your `riskcoins` repository
   - Click "Connect"

3. **Configure Backend Service**
   ```
   Name: riskcoins-backend
   Region: Same as your database (e.g., Oregon)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm run build
   Start Command: npm start
   Plan: Free
   ```

4. **Add Environment Variables**
   
   Click "Advanced" → "Add Environment Variable" and add these:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | Paste your Internal Database URL from Step 2 |
   | `JWT_SECRET` | Generate using the command below |
   | `JWT_EXPIRES_IN` | `1h` |
   | `ADMIN_SECRET` | Generate using the command below |
   | `FRONTEND_URL` | Leave empty for now (we'll update this later) |

   **Generate Secure Secrets** (Run in your terminal):
   ```powershell
   # Generate JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Generate ADMIN_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Create Web Service**
   - Click "Create Web Service"
   - Render will start building your backend
   - This takes 5-10 minutes on first deploy

6. **Get Your Backend URL**
   - Once deployed (status shows "Live"), copy your backend URL
   - It will look like: `https://riskcoins-backend.onrender.com`
   - **Save this URL!** You'll need it for the frontend

---

## 🎨 Step 4: Deploy Frontend

### Option A: Using Render Static Site (Simpler)

1. **Update Frontend Config First**
   
   Open `frontend/config.js` and update it:
   ```javascript
   // Use your actual backend URL from Step 3
   const API_BASE = window.location.hostname === 'localhost' 
     ? "http://localhost:4000" 
     : "https://riskcoins-backend.onrender.com"; // YOUR BACKEND URL
   ```

2. **Commit and Push Changes**
   ```bash
   git add frontend/config.js
   git commit -m "Update API_BASE for production"
   git push
   ```

3. **Create New Static Site**
   - Go back to Render Dashboard
   - Click "New +" button
   - Select "Static Site"

4. **Configure Frontend**
   ```
   Name: riskcoins-frontend
   Branch: main
   Root Directory: frontend
   Build Command: echo "No build needed"
   Publish Directory: . (just a dot)
   ```

5. **Create Static Site**
   - Click "Create Static Site"
   - Deployment takes 1-2 minutes

6. **Get Your Frontend URL**
   - Copy your frontend URL (e.g., `https://riskcoins-frontend.onrender.com`)

### Option B: Using Render Web Service (Alternative)

If static site doesn't work as expected:

1. Create a simple `server.js` in frontend folder:
   ```javascript
   const express = require('express');
   const path = require('path');
   const app = express();
   const port = process.env.PORT || 3000;

   app.use(express.static(__dirname));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'index.html'));
   });

   app.listen(port, () => console.log(`Frontend running on port ${port}`));
   ```

2. Add to `frontend/package.json`:
   ```json
   {
     "name": "riskcoins-frontend",
     "version": "1.0.0",
     "scripts": {
       "start": "node server.js"
     },
     "dependencies": {
       "express": "^4.18.2"
     }
   }
   ```

3. Deploy as Web Service with:
   - Build Command: `npm install`
   - Start Command: `npm start`

---

## 🔄 Step 5: Update Backend CORS

Now that you have your frontend URL, update the backend:

1. **Go to Backend Service**
   - Dashboard → Select `riskcoins-backend`

2. **Update Environment Variables**
   - Find `FRONTEND_URL` variable
   - Set value to your frontend URL: `https://riskcoins-frontend.onrender.com`
   - Click "Save Changes"

3. **Redeploy**
   - Backend will automatically redeploy with new settings
   - Wait for "Live" status

---

## 🧪 Step 6: Test Your Deployment

1. **Visit Your Frontend**
   - Go to your frontend URL
   - Try signing up as a new user
   - Check if email verification works

2. **Create Admin Account**
   - Navigate to: `https://riskcoins-frontend.onrender.com/admin_signup.html`
   - Use your `ADMIN_SECRET` to create an admin account

3. **Test All Features**
   - Student registration
   - House creation
   - Events
   - Shop items
   - Point system

---

## 🎯 Important: Free Tier Limitations

### Render Free Tier includes:
- ✅ **Web Services**: 750 hours/month (enough for 1 app running 24/7)
- ✅ **Static Sites**: Unlimited
- ✅ **PostgreSQL**: Free for 90 days (90-day renewals available)
- ⚠️ **Sleep Mode**: Services sleep after 15 minutes of inactivity
- ⚠️ **Cold Start**: First request after sleep takes 30-60 seconds

### What this means:
- Your app will be slow to respond after being idle
- First visit after inactivity will take ~1 minute to wake up
- Subsequent requests will be fast
- Database needs to be renewed every 90 days (free process)

---

## 🔐 Security Checklist

After deployment, verify:

- [ ] `JWT_SECRET` is set to a random 128-character string
- [ ] `ADMIN_SECRET` is set to a random 64-character string
- [ ] `FRONTEND_URL` is set to your actual frontend domain
- [ ] `NODE_ENV` is set to `production`
- [ ] Database password is strong (auto-generated by Render)
- [ ] All environment variables are set in Render (not in code)

---

## 🔄 Making Updates

To deploy changes:

```bash
# Make your changes
git add .
git commit -m "Your change description"
git push

# Render will automatically detect and deploy changes!
```

---

## 📊 Monitoring Your App

1. **View Logs**
   - Go to your service in Render Dashboard
   - Click "Logs" tab
   - See real-time logs

2. **Check Metrics**
   - Click "Metrics" tab
   - See CPU, memory, request counts

3. **Set Up Notifications**
   - Click "Settings" → "Notifications"
   - Add email for deploy notifications

---

## 🆘 Troubleshooting

### Backend won't start:
- Check logs for errors
- Verify all environment variables are set
- Ensure `DATABASE_URL` is the Internal Database URL

### Database connection fails:
- Use **Internal Database URL** (not External)
- Check if database is active in Render Dashboard
- Verify `DATABASE_URL` format: `postgres://user:password@host:5432/database`

### Frontend can't connect to backend:
- Verify `config.js` has correct backend URL
- Check `FRONTEND_URL` is set in backend
- Look for CORS errors in browser console

### "Service Unavailable" errors:
- This is normal after 15 minutes of inactivity (cold start)
- Wait 30-60 seconds and try again
- Consider using a service like UptimeRobot to ping your app every 14 minutes

### Migrations fail:
- Check if database is accessible
- Verify `DATABASE_URL` is correct
- Try manually running: `npx prisma migrate deploy` in Render Shell

---

## 🎉 Success!

Your RiskCoins app is now live on Render! 

- **Frontend**: https://riskcoins-frontend.onrender.com
- **Backend**: https://riskcoins-backend.onrender.com
- **Database**: Managed PostgreSQL

### Next Steps:
1. Set up a custom domain (when you buy one)
2. Configure DNS records
3. Set up email alerts for downtime
4. Monitor usage and performance

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Free Tier Details](https://render.com/docs/free)
- [Prisma on Render](https://render.com/docs/deploy-prisma)
- [Custom Domains on Render](https://render.com/docs/custom-domains)

---

## 💡 Pro Tips

1. **Keep Services Awake**: Use [Cron-job.org](https://cron-job.org) to ping your backend every 14 minutes
2. **Monitor Uptime**: Use [UptimeRobot](https://uptimerobot.com) (free) to monitor your app
3. **Database Backup**: Download PostgreSQL backups regularly from Render
4. **Environment Variables**: Never commit secrets to GitHub
5. **Branch Strategy**: Use `main` for production, `dev` for testing

---

**Need help?** Check the logs first, they usually tell you what's wrong!

Good luck! 🚀
