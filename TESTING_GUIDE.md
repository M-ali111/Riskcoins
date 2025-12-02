# Security Testing Script

## Test 1: Verify .gitignore is working

```powershell
cd backend
git check-ignore .env
# Should output: .env (means it's ignored)

git check-ignore node_modules/
# Should output: node_modules/ (means it's ignored)
```

## Test 2: Check for vulnerabilities

```powershell
cd backend
npm audit
```

**Expected**: Hopefully 0 vulnerabilities. If any, run:
```powershell
npm audit fix
```

## Test 3: Verify environment variables

```powershell
cd backend
node -e "require('dotenv').config(); console.log('JWT_SECRET length:', process.env.JWT_SECRET.length); console.log('ADMIN_SECRET length:', process.env.ADMIN_SECRET.length)"
```

**Expected**: 
- JWT_SECRET length: 128 (64 bytes in hex)
- ADMIN_SECRET length: 64 (32 bytes in hex)

If you see these lengths: **43** or **27**, you're still using the default weak secrets!

## Test 4: Test Rate Limiting

```powershell
# Start your server
cd backend
npm run dev

# In another PowerShell window, test rate limiting:
1..10 | ForEach-Object { 
    Invoke-RestMethod -Uri "http://localhost:4000/api/health" -Method GET
    Write-Host "Request $_"
}
```

**Expected**: All should succeed (under limit)

## Test 5: Test File Upload Validation

Create a test text file:
```powershell
echo "test" > test.txt
```

Try to upload it (should fail):
```powershell
# This should FAIL because .txt is not allowed
$headers = @{
    "Authorization" = "Bearer YOUR_ADMIN_TOKEN"
}
$form = @{
    file = Get-Item -Path "test.txt"
}
Invoke-RestMethod -Uri "http://localhost:4000/api/admin/items" -Method POST -Headers $headers -Form $form
```

**Expected**: Error message about invalid file type

## Test 6: Test Input Validation

```powershell
# Test with invalid email
$body = @{
    email = "notanemail"
    password = "test123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

**Expected**: Error about invalid email format

## Test 7: Test CORS

```powershell
# Test from unauthorized origin (should fail in production)
$headers = @{
    "Origin" = "http://evil-site.com"
}
Invoke-RestMethod -Uri "http://localhost:4000/api/health" -Method GET -Headers $headers
```

**Expected**: In development: works. In production: should fail.

## Test 8: Verify Password Hashing

```powershell
cd backend
node -e "
const bcrypt = require('bcrypt');
const password = 'TestPassword123';
bcrypt.hash(password, 12).then(hash => {
    console.log('Hash:', hash);
    console.log('Hash length:', hash.length);
    bcrypt.compare(password, hash).then(match => {
        console.log('Match:', match);
    });
});
"
```

**Expected**: Should show a hash starting with `$2b$12$` and Match: true

## Test 9: Test JWT Expiration

```powershell
cd backend
node -e "
const jwt = require('jsonwebtoken');
require('dotenv').config();
const token = jwt.sign({ sub: 'test-user', role: 'STUDENT' }, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log('Generated token:', token);
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log('Decoded:', decoded);
console.log('Expires at:', new Date(decoded.exp * 1000));
"
```

**Expected**: Should show token and expiration time 1 hour from now

## Test 10: Check Database Connection

```powershell
cd backend
node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
    .then(() => {
        console.log('✅ Database connected successfully');
        return prisma.house.count();
    })
    .then(count => {
        console.log('Number of houses:', count);
        return prisma.\$disconnect();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });
"
```

**Expected**: Should show connection success and house count

---

## Security Checklist

Run through this before deploying:

```powershell
# 1. Check secrets are strong
cd backend
node -e "require('dotenv').config(); if(process.env.JWT_SECRET.includes('change_this')) { console.log('❌ CHANGE JWT_SECRET!') } else { console.log('✅ JWT_SECRET looks good') }"

node -e "require('dotenv').config(); if(process.env.ADMIN_SECRET === 'riskcoins-super-secret-key') { console.log('❌ CHANGE ADMIN_SECRET!') } else { console.log('✅ ADMIN_SECRET looks good') }"

# 2. Check .env is ignored
git check-ignore .env
if ($?) { Write-Host "✅ .env is ignored" -ForegroundColor Green } else { Write-Host "❌ .env is NOT ignored!" -ForegroundColor Red }

# 3. Check for vulnerabilities
npm audit --audit-level=moderate

# 4. Check Node version
node --version
# Should be v18 or higher

# 5. Check if .env exists
if (Test-Path .env) { Write-Host "✅ .env file exists" -ForegroundColor Green } else { Write-Host "❌ .env file missing!" -ForegroundColor Red }

# 6. Check if .gitignore exists
if (Test-Path .gitignore) { Write-Host "✅ .gitignore exists" -ForegroundColor Green } else { Write-Host "❌ .gitignore missing!" -ForegroundColor Red }

# 7. Check uploads directory
if (Test-Path uploads/items) { Write-Host "✅ uploads/items exists" -ForegroundColor Green } else { Write-Host "❌ uploads/items missing!" -ForegroundColor Red }
if (Test-Path uploads/houses) { Write-Host "✅ uploads/houses exists" -ForegroundColor Green } else { Write-Host "❌ uploads/houses missing!" -ForegroundColor Red }
```

---

## Manual Testing Checklist

- [ ] Can create student account
- [ ] Can login as student
- [ ] Can view leaderboard
- [ ] Can buy shop item (if house has points)
- [ ] Cannot access admin routes as student
- [ ] Can create admin account with correct ADMIN_SECRET
- [ ] Cannot create admin account with wrong ADMIN_SECRET
- [ ] Can login as admin
- [ ] Can add/remove points as admin
- [ ] Can create shop items with image upload
- [ ] Cannot upload non-image files
- [ ] Cannot upload files larger than 5MB
- [ ] Rate limiting kicks in after too many requests
- [ ] Invalid email format is rejected
- [ ] Short passwords are rejected
- [ ] CORS blocks unauthorized origins (in production)
- [ ] Error messages don't leak sensitive info (in production)

---

## Performance Testing

```powershell
# Test concurrent requests (requires Apache Bench)
# Install: choco install apache-httpd (requires Chocolatey)

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:4000/api/health
```

**Expected**: All requests should succeed, no errors

---

## Database Testing

```powershell
cd backend

# Test Prisma connection
npx prisma db pull

# Check migrations are up to date
npx prisma migrate status

# Seed database if needed
node src/utils/seed.js
```

---

## Production Deployment Test

Before going live, test in production mode:

```powershell
# Set production environment
$env:NODE_ENV = "production"

# Start server
npm start

# Test endpoints
# - Health check
# - Login
# - Protected routes
# - File uploads

# Check logs for any errors
```

---

## If Something Fails

1. **Check logs**: Look for error messages
2. **Check .env**: Verify all variables are set
3. **Check database**: Ensure it's running and accessible
4. **Check permissions**: Ensure uploads/ folder has write access
5. **Check firewall**: Ensure ports are open
6. **Check Node version**: Should be 18+
7. **Clear cache**: Sometimes `rm -rf node_modules && npm install` helps

---

## Get Help

If tests fail:
1. Check the error message carefully
2. Review SECURITY_AUDIT.md
3. Review DEPLOYMENT_GUIDE.md
4. Check your .env file matches .env.example format
5. Ensure all dependencies are installed: `npm install`
