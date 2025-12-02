const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { Role } = require('@prisma/client');
const { validateEmail, validateSchoolEmail, validatePassword, sanitizeString } = require('../middleware/validation');
const { 
  generateVerificationCode, 
  getVerificationExpiry, 
  sendVerificationEmail,
  sendPasswordResetEmail,
  ALLOWED_EMAIL_DOMAINS 
} = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const TEACHER_SECRET = process.env.TEACHER_SECRET;

// Validate JWT_SECRET exists
if (!JWT_SECRET || JWT_SECRET === 'change_this_to_a_long_random_string') {
  console.error('CRITICAL: JWT_SECRET is not set or using default value!');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
}

/* ---------------------------------------------
   SECURE ADMIN SIGNUP
--------------------------------------------- */
router.post('/admin/secure-signup', async (req, res, next) => {
  try {
    const { email, password, name, secret } = req.body;

    // Validate admin secret
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Invalid admin secret key" });
    }

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Validate school email
    if (!validateSchoolEmail(email)) {
      return res.status(400).json({ 
        error: `Email must be from an allowed school domain: ${ALLOWED_EMAIL_DOMAINS.join(', ')}` 
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();
    const sanitizedName = sanitizeString(name, 100);

    const existing = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = getVerificationExpiry();

    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        name: sanitizedName,
        role: Role.ADMIN,
        verificationToken: verificationCode,
        verificationTokenExpiry: verificationExpiry,
        isEmailVerified: false
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(sanitizedEmail, sanitizedName, verificationCode);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the signup, but inform the user
    }

    // Don't return passwordHash or verification token
    const { passwordHash: _, verificationToken: __, ...userWithoutPassword } = user;
    res.json({ 
      success: true, 
      message: "Admin account created. Please check your email for verification code.",
      user: userWithoutPassword,
      needsVerification: true
    });
  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------
   TEACHER SECURE SIGNUP
--------------------------------------------- */
router.post('/teacher/secure-signup', async (req, res, next) => {
  try {
    const { email, password, name, secret } = req.body;

    // Validate teacher secret
    if (!secret || secret !== TEACHER_SECRET) {
      return res.status(403).json({ error: "Invalid teacher secret key" });
    }

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Validate school email
    if (!validateSchoolEmail(email)) {
      return res.status(400).json({ 
        error: `Email must be from an allowed school domain: ${ALLOWED_EMAIL_DOMAINS.join(', ')}` 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();
    const sanitizedName = sanitizeString(name, 100);

    const existing = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = getVerificationExpiry();

    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        name: sanitizedName,
        role: Role.TEACHER,
        verificationToken: verificationCode,
        verificationTokenExpiry: verificationExpiry,
        isEmailVerified: false
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(sanitizedEmail, sanitizedName, verificationCode);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    const { passwordHash: _, verificationToken: __, ...userWithoutPassword } = user;
    res.json({ 
      success: true, 
      message: "Teacher account created. Please check your email for verification code.",
      user: userWithoutPassword,
      needsVerification: true
    });
  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------
   STUDENT SIGNUP
--------------------------------------------- */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name, houseName } = req.body;

    // Validate required fields
    if (!email || !password || !name || !houseName)
      return res.status(400).json({ error: 'Missing fields' });

    // Validate school email
    if (!validateSchoolEmail(email)) {
      return res.status(400).json({ 
        error: `Email must be from an allowed school domain: ${ALLOWED_EMAIL_DOMAINS.join(', ')}` 
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedHouseName = sanitizeString(houseName, 100);

    const house = await prisma.house.findUnique({ where: { name: sanitizedHouseName } });
    if (!house) return res.status(400).json({ error: 'Invalid house' });

    const existing = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = getVerificationExpiry();

    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        name: sanitizedName,
        role: 'STUDENT',
        house: { connect: { id: house.id } },
        verificationToken: verificationCode,
        verificationTokenExpiry: verificationExpiry,
        isEmailVerified: false
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(sanitizedEmail, sanitizedName, verificationCode);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      house: house.name,
      needsVerification: true,
      message: "Account created. Please check your email for verification code."
    });
  } catch (err) {
    next(err);
  }
});


/* ---------------------------------------------
   EMAIL VERIFICATION
--------------------------------------------- */
router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Missing email or verification code' });
    }

    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: sanitizedEmail } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    if (!user.verificationToken || !user.verificationTokenExpiry) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    // Check if token is expired
    if (new Date() > user.verificationTokenExpiry) {
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }

    // Verify the code
    if (user.verificationToken !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      }
    });

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------
   RESEND VERIFICATION CODE
--------------------------------------------- */
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: sanitizedEmail } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = getVerificationExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationCode,
        verificationTokenExpiry: verificationExpiry
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(sanitizedEmail, user.name, verificationCode);
      res.json({ success: true, message: 'Verification code sent to your email' });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------
   LOGIN
--------------------------------------------- */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Missing fields' });

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: sanitizedEmail } });

    // Use same error message to prevent user enumeration
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        needsVerification: true,
        email: user.email
      });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------
   FORGOT PASSWORD - REQUEST RESET
--------------------------------------------- */
router.post('/forgot-password/request', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email: sanitizedEmail } 
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return res.json({ 
        success: true, 
        message: "If an account with that email exists, a reset code has been sent." 
      });
    }

    // Check if user's email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({ 
        error: "Please verify your email first before resetting password." 
      });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const resetExpiry = getVerificationExpiry();

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetCode,
        resetTokenExpiry: resetExpiry
      }
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(sanitizedEmail, user.name, resetCode);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({ 
        error: "Failed to send reset email. Please try again later." 
      });
    }

    res.json({ 
      success: true, 
      message: "Password reset code has been sent to your email." 
    });

  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------
   FORGOT PASSWORD - VERIFY RESET CODE
--------------------------------------------- */
router.post('/forgot-password/verify-code', async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();

    const user = await prisma.user.findUnique({ 
      where: { email: sanitizedEmail } 
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if reset token exists
    if (!user.resetToken) {
      return res.status(400).json({ error: "No reset request found. Please request a new reset code." });
    }

    // Check if token expired
    if (new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
    }

    // Verify code
    if (user.resetToken !== code) {
      return res.status(400).json({ error: "Invalid reset code" });
    }

    res.json({ 
      success: true, 
      message: "Code verified successfully. You can now reset your password." 
    });

  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------
   FORGOT PASSWORD - RESET PASSWORD
--------------------------------------------- */
router.post('/forgot-password/reset', async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, code, and new password are required" });
    }

    // Validate password strength
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();

    const user = await prisma.user.findUnique({ 
      where: { email: sanitizedEmail } 
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if reset token exists
    if (!user.resetToken) {
      return res.status(400).json({ error: "No reset request found. Please request a new reset code." });
    }

    // Check if token expired
    if (new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
    }

    // Verify code
    if (user.resetToken !== code) {
      return res.status(400).json({ error: "Invalid reset code" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ 
      success: true, 
      message: "Password has been reset successfully. You can now log in with your new password." 
    });

  } catch (err) {
    next(err);
  }
});


module.exports = router;
