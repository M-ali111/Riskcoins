# Email Verification System Setup Guide

This document explains the new email verification system that restricts signups to school email addresses and requires email verification before login.

## Overview

The system now includes:
1. **School Email Validation** - Only emails from configured domains can sign up
2. **Email Verification** - Users must verify their email with a 6-digit code
3. **Login Restriction** - Unverified users cannot log in until they verify their email

## Configuration

### 1. Update Environment Variables

Edit `backend/.env` and configure the following:

```env
# Email Configuration for Verification
EMAIL_HOST="smtp.gmail.com"          # SMTP server (for Gmail)
EMAIL_PORT=587                        # SMTP port (587 for TLS, 465 for SSL)
EMAIL_USER="your-school-email@school.edu"    # Your email address
EMAIL_PASS="your-app-password-here"  # App password (see below)
EMAIL_FROM="RiskCoins School <your-school-email@school.edu>"  # Sender name/email

# Allowed school email domains (comma-separated)
ALLOWED_EMAIL_DOMAINS="school.edu,student.school.edu"
```

### 2. Gmail Setup (Recommended)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Create an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password
   - Use this as `EMAIL_PASS` (without spaces)

### 3. Other Email Providers

For other providers (Microsoft 365, Yahoo, etc.):

```env
# Microsoft 365 / Outlook
EMAIL_HOST="smtp.office365.com"
EMAIL_PORT=587

# Yahoo Mail
EMAIL_HOST="smtp.mail.yahoo.com"
EMAIL_PORT=587

# Custom SMTP Server
EMAIL_HOST="mail.yourschool.edu"
EMAIL_PORT=587
```

### 4. Configure Allowed Domains

Update `ALLOWED_EMAIL_DOMAINS` with your school's email domains:

```env
# Single domain
ALLOWED_EMAIL_DOMAINS="school.edu"

# Multiple domains (comma-separated, no spaces)
ALLOWED_EMAIL_DOMAINS="school.edu,student.school.edu,staff.school.edu"
```

## How It Works

### Signup Flow

1. **User enters details** (name, email, password, etc.)
2. **System validates**:
   - Email format is valid
   - Email domain is in the allowed list
   - Password meets requirements
3. **Account created** with `isEmailVerified = false`
4. **Verification email sent** with 6-digit code
5. **User redirected** to verification page

### Verification Flow

1. User enters 6-digit code from email
2. System validates:
   - Code matches stored token
   - Token hasn't expired (15-minute expiry)
3. Account marked as verified
4. User can now log in

### Login Flow

1. User enters email and password
2. Credentials validated
3. **Email verification checked**:
   - If verified → Login successful
   - If not verified → Redirect to verification page

## API Endpoints

### POST `/api/auth/signup` (Student)
Creates a student account and sends verification email.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@school.edu",
  "password": "SecurePass123",
  "houseName": "Aydahar"
}
```

**Response (Success):**
```json
{
  "id": "user-uuid",
  "email": "john@school.edu",
  "name": "John Doe",
  "house": "Aydahar",
  "needsVerification": true,
  "message": "Account created. Please check your email for verification code."
}
```

### POST `/api/auth/teacher/secure-signup`
Creates a teacher account with verification.

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@school.edu",
  "password": "SecurePass123",
  "secret": "teacher-secret-key"
}
```

### POST `/api/auth/admin/secure-signup`
Creates an admin account with verification.

**Request:**
```json
{
  "name": "Admin User",
  "email": "admin@school.edu",
  "password": "SecurePass123",
  "secret": "admin-secret-key"
}
```

### POST `/api/auth/verify-email`
Verifies user email with code.

**Request:**
```json
{
  "email": "john@school.edu",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

**Error Responses:**
- `400` - Invalid or expired code
- `404` - User not found
- `400` - Email already verified

### POST `/api/auth/resend-verification`
Resends verification code to user.

**Request:**
```json
{
  "email": "john@school.edu"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

### POST `/api/auth/login`
Login with email verification check.

**Request:**
```json
{
  "email": "john@school.edu",
  "password": "SecurePass123"
}
```

**Response (Unverified):**
```json
{
  "error": "Email not verified",
  "needsVerification": true,
  "email": "john@school.edu"
}
```

## Database Schema Changes

New fields added to `User` model:

```prisma
model User {
  // ... existing fields ...
  
  isEmailVerified         Boolean   @default(false)
  verificationToken       String?
  verificationTokenExpiry DateTime?
}
```

## Development Mode

In development (`NODE_ENV=development`), if email credentials are not configured:
- The system will log verification codes to the console
- No actual emails will be sent
- You can still test the verification flow using console codes

Example console output:
```
========================================
VERIFICATION CODE FOR john@school.edu: 123456
========================================
```

## Testing the System

### 1. Test Signup with Wrong Domain
Try signing up with `john@gmail.com`:
- Should fail with: "Email must be from an allowed school domain: school.edu"

### 2. Test Signup with School Email
Sign up with `john@school.edu`:
- Account should be created
- Verification email sent (or code shown in console)
- Redirected to verification page

### 3. Test Verification
Enter the 6-digit code:
- Valid code → Success, redirect to login
- Invalid code → Error message
- Expired code (>15 min) → Error, option to resend

### 4. Test Login Before Verification
Try to log in before verifying:
- Should fail with email verification error
- Redirect to verification page

### 5. Test Login After Verification
Log in after verifying email:
- Should succeed and redirect to dashboard

## Security Features

1. **Domain Whitelisting** - Only configured school domains allowed
2. **Token Expiry** - Verification codes expire after 15 minutes
3. **One-Time Use** - Codes are cleared after successful verification
4. **Rate Limiting** - Can be added using existing rate limiters
5. **HTTPS** - Ensure production uses HTTPS for security

## Troubleshooting

### Emails Not Sending

1. Check email credentials in `.env`
2. Verify SMTP settings are correct
3. For Gmail, ensure App Password is used (not regular password)
4. Check server console for error messages
5. Test with `nodemailer` directly if needed

### "Invalid App Password" Error (Gmail)

1. Ensure 2FA is enabled on Google account
2. Generate new App Password
3. Remove spaces from the password
4. Update `.env` with new password

### Verification Codes Not Working

1. Check code hasn't expired (15-minute limit)
2. Verify email address matches exactly
3. Check database for `verificationToken` value
4. Try resending code with "Resend Code" button

### Domain Validation Issues

1. Check `ALLOWED_EMAIL_DOMAINS` in `.env`
2. Ensure no spaces in domain list
3. Domain matching is case-insensitive
4. Check for typos in domain names

## Frontend Pages

- **`verify_email.html`** - Email verification page
- **`signup.html`** - Student signup (updated)
- **`teacher_signup.html`** - Teacher signup (updated)
- **`admin_signup.html`** - Admin signup (updated)
- **`index.html`** - Login page (updated with verification check)

## Next Steps

1. Configure your school's email credentials
2. Update allowed email domains
3. Test the signup and verification flow
4. Consider adding email templates customization
5. Monitor email delivery rates
6. Set up email service monitoring

## Support

For issues or questions:
1. Check the console logs in backend terminal
2. Verify `.env` configuration
3. Test with development mode first
4. Check email provider's SMTP documentation
