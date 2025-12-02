# 🚀 Production Deployment Guide - RiskCoins

## Quick Start: Generate Secure Secrets

### Windows PowerShell
```powershell
# Navigate to backend folder
cd backend

# Generate JWT_SECRET (64 bytes = 128 hex chars)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate ADMIN_SECRET (32 bytes = 64 hex chars)
node -e "console.log('ADMIN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and update your `.env` file.

---

## Option 1: Railway (Easiest - Recommended for Beginners)

### Backend Deployment

1. **Sign up at Railway.app**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Provision PostgreSQL"
   - Note the database credentials

3. **Deploy Backend**
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Set root directory to `/riskcoins/backend`

4. **Set Environment Variables**
   ```
   DATABASE_URL=<copy from Railway PostgreSQL>
   JWT_SECRET=<your generated secret>
   JWT_EXPIRES_IN=1h
   PORT=4000
   NODE_ENV=production
   ADMIN_SECRET=<your generated secret>
   FRONTEND_URL=<your frontend URL after deployment>
   ```

5. **Add Start Command**
   - Settings → Start Command: `npm run start`

6. **Generate Domain**
   - Settings → Generate Domain
   - Copy the URL (e.g., https://your-app.up.railway.app)

### Frontend Deployment (Vercel)

1. **Sign up at Vercel.com**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your repository
   - Set root directory to `/riskcoins/frontend`

3. **Update config.js**
   - Before deploying, update `frontend/config.js`:
   ```javascript
   const API_BASE = "https://your-app.up.railway.app";
   ```

4. **Deploy**
   - Click "Deploy"
   - Copy your frontend URL

5. **Update Backend CORS**
   - Go back to Railway
   - Update `FRONTEND_URL` with your Vercel URL
   - Redeploy backend

---

## Option 2: VPS Deployment (DigitalOcean/Linode)

### Prerequisites
- Ubuntu 22.04 VPS
- Domain name (optional but recommended)
- SSH access

### Step 1: Server Setup

```bash
# Connect to server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 globally
npm install -g pm2

# Install Git
apt install -y git
```

### Step 2: PostgreSQL Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE riskcoins;
CREATE USER riskcoins_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE riskcoins TO riskcoins_user;
\q
```

### Step 3: Clone and Setup Backend

```bash
# Create app directory
mkdir -p /var/www/riskcoins
cd /var/www/riskcoins

# Clone your repo (or use git)
git clone <your-repo-url> .

# Navigate to backend
cd riskcoins/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

Add to `.env`:
```env
DATABASE_URL="postgresql://riskcoins_user:your_strong_password_here@localhost:5432/riskcoins?schema=public"
JWT_SECRET="<your generated secret>"
JWT_EXPIRES_IN="1h"
PORT=4000
NODE_ENV=production
ADMIN_SECRET="<your generated secret>"
FRONTEND_URL="https://yourdomain.com"
```

```bash
# Run Prisma migrations
npx prisma migrate deploy
npx prisma generate

# Create uploads directories
mkdir -p uploads/items uploads/houses

# Start with PM2
pm2 start src/index.js --name riskcoins-api
pm2 save
pm2 startup
```

### Step 4: Nginx Configuration

```bash
# Create Nginx config
nano /etc/nginx/sites-available/riskcoins
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend files
    location / {
        root /var/www/riskcoins/riskcoins/frontend;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/riskcoins /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 5: SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test renewal
certbot renew --dry-run
```

### Step 6: Firewall Setup

```bash
# Enable UFW
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## Option 3: Docker Deployment

### Create Dockerfile (Backend)

Create `riskcoins/backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 4000

CMD ["node", "src/index.js"]
```

### Create docker-compose.yml

Create `riskcoins/docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: riskcoins
      POSTGRES_USER: riskcoins_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://riskcoins_user:${DB_PASSWORD}@postgres:5432/riskcoins?schema=public
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 1h
      PORT: 4000
      NODE_ENV: production
      ADMIN_SECRET: ${ADMIN_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    ports:
      - "4000:4000"
    depends_on:
      - postgres
    volumes:
      - ./backend/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

Create `.env` in `riskcoins/` directory:
```env
DB_PASSWORD=your_strong_password
JWT_SECRET=your_generated_jwt_secret
ADMIN_SECRET=your_generated_admin_secret
FRONTEND_URL=http://localhost
```

### Deploy with Docker

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Post-Deployment Steps

### 1. Run Security Check
```bash
npm audit
npm audit fix
```

### 2. Create First Admin
Use your API client (Postman, Insomnia) or curl:

```bash
curl -X POST https://your-api-url/api/auth/admin/secure-signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourStrongPassword123!",
    "name": "Admin Name",
    "secret": "your_ADMIN_SECRET_value"
  }'
```

### 3. Seed Houses
```bash
# If using Railway/Heroku
railway run npx prisma db seed

# If using VPS
cd /var/www/riskcoins/riskcoins/backend
node src/utils/seed.js
```

### 4. Test All Endpoints
- [ ] Login (student & admin)
- [ ] Signup
- [ ] View leaderboard
- [ ] Buy shop item
- [ ] Upload house image (admin)
- [ ] Create event (admin)
- [ ] Join event (student)

### 5. Monitor Application
```bash
# If using PM2
pm2 monit

# View logs
pm2 logs riskcoins-api

# Check status
pm2 status
```

---

## Maintenance Commands

### Update Application (VPS)
```bash
cd /var/www/riskcoins
git pull
cd riskcoins/backend
npm install --production
npx prisma migrate deploy
pm2 restart riskcoins-api
```

### Database Backup
```bash
# Backup
pg_dump -U riskcoins_user riskcoins > backup_$(date +%Y%m%d).sql

# Restore
psql -U riskcoins_user riskcoins < backup_20251130.sql
```

### View Logs
```bash
# PM2 logs
pm2 logs riskcoins-api --lines 100

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs riskcoins-api

# Check .env file
cat .env

# Test database connection
psql -U riskcoins_user -d riskcoins -c "SELECT 1;"
```

### CORS errors
- Check FRONTEND_URL in backend .env
- Verify CORS settings in app.js
- Check browser console for exact error

### Database connection issues
- Verify DATABASE_URL format
- Check PostgreSQL is running: `systemctl status postgresql`
- Test connection: `psql $DATABASE_URL`

### File uploads not working
- Check uploads directory permissions: `chmod 755 uploads`
- Check disk space: `df -h`
- Verify multer configuration

---

## Scaling Considerations

### For High Traffic:
1. **Load Balancer**: Use Nginx load balancing or cloud LB
2. **Database**: 
   - Connection pooling (Prisma supports this)
   - Read replicas for queries
   - Use managed database (AWS RDS, Railway, etc.)
3. **Caching**: Add Redis for sessions/frequently accessed data
4. **CDN**: Use Cloudflare or AWS CloudFront for static files
5. **Horizontal Scaling**: Multiple backend instances behind load balancer

---

## Security Reminder

✅ **Before going live:**
- Change all default secrets
- Enable HTTPS
- Test authentication flows
- Review logs for errors
- Set up monitoring
- Create backup strategy
- Document admin procedures

Good luck with your deployment! 🚀
