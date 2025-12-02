# Quick Security Setup

## Generate Strong Secrets NOW

### Windows PowerShell (Run these commands):

```powershell
# Navigate to your backend folder first
cd C:\Users\muham\OneDrive\Desktop\trial\riskcoins\backend

# Generate JWT_SECRET
Write-Host "Add this to your .env file:" -ForegroundColor Green
node -e "console.log('JWT_SECRET=\"' + require('crypto').randomBytes(64).toString('hex') + '\"')"

Write-Host "`nAdd this to your .env file:" -ForegroundColor Green
# Generate ADMIN_SECRET
node -e "console.log('ADMIN_SECRET=\"' + require('crypto').randomBytes(32).toString('hex') + '\"')"
```

## Update Your .env File

1. Open `backend\.env`
2. Replace the JWT_SECRET line with your generated value
3. Replace the ADMIN_SECRET line with your generated value
4. Change the database password from `ali11` to something strong

### Example Strong .env:
```env
DATABASE_URL="postgresql://Ali:R4nd0m_P@ssw0rd_H3r3@localhost:5432/riskcoins?schema=public"
JWT_SECRET="a1b2c3d4e5f6...128 character hex string...xyz"
JWT_EXPIRES_IN="1h"
PORT=4000
NODE_ENV=development
ADMIN_SECRET="9f8e7d6c5b4a...64 character hex string...321"
FRONTEND_URL="http://localhost:3000"
```

## Before Hosting - Critical Checklist

- [ ] Generated new JWT_SECRET (run command above)
- [ ] Generated new ADMIN_SECRET (run command above)
- [ ] Changed database password
- [ ] Created .gitignore files (already done ✅)
- [ ] Set NODE_ENV=production for hosting
- [ ] Updated FRONTEND_URL to your actual domain
- [ ] Updated frontend/config.js with production API URL
- [ ] Never commit .env file to Git
- [ ] Run `npm audit` to check for vulnerabilities

## Test Your Security

```powershell
# Check for security vulnerabilities
npm audit

# Attempt to fix them automatically
npm audit fix

# Check if .env is in .gitignore
git check-ignore backend/.env
# Should output: backend/.env

# Make sure .env is NOT in Git
git ls-files | Select-String ".env"
# Should be empty!
```

## If .env is Already in Git

```powershell
# Remove from Git (but keep local file)
git rm --cached backend/.env
git commit -m "Remove .env from version control"
git push
```

⚠️ **IMPORTANT**: If your repo is public on GitHub and you already pushed the .env file, your secrets are compromised! Generate new ones immediately and update them everywhere.
