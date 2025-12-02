const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email & branding configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
// Branding: default to "RIS House Coins" if not provided
const BRAND_NAME = process.env.BRAND_NAME || 'RIS House Coins';
// Longer form system label used in sender name/footer
const BRAND_SYSTEM_NAME = process.env.BRAND_SYSTEM_NAME || `${BRAND_NAME} School System`;

// School email domain configuration
const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'school.edu')
  .split(',')
  .map(domain => domain.trim().toLowerCase());

// Verification token expiry (15 minutes)
const VERIFICATION_TOKEN_EXPIRY_MINUTES = 15;

// Create transporter
let transporter = null;

function createTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email credentials not configured. Verification emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

/**
 * Validate if email belongs to allowed school domains
 */
function isSchoolEmail(email) {
  const emailLower = email.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some(domain => 
    emailLower.endsWith(`@${domain}`)
  );
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate verification token expiry date
 */
function getVerificationExpiry() {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + VERIFICATION_TOKEN_EXPIRY_MINUTES);
  return expiry;
}

/**
 * Send verification email
 */
async function sendVerificationEmail(email, name, verificationCode) {
  // Check if email credentials are properly configured
  const isEmailConfigured = EMAIL_USER && 
                            EMAIL_PASS && 
                            EMAIL_USER !== 'your-school-email@school.edu' &&
                            EMAIL_PASS !== 'your-app-password-here';

  // In development or if email not configured, just log the code
  if (process.env.NODE_ENV === 'development' || !isEmailConfigured) {
    console.log(`\n========================================`);
    console.log(`📧 VERIFICATION CODE FOR ${email}`);
    console.log(`CODE: ${verificationCode}`);
    console.log(`NAME: ${name}`);
    console.log(`========================================\n`);
    return { success: true, devMode: true };
  }

  if (!transporter) {
    transporter = createTransporter();
  }

  if (!transporter) {
    console.error('Email transporter not configured. Verification code:', verificationCode);
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: `"${BRAND_SYSTEM_NAME}" <${EMAIL_FROM}>`,
    to: email,
    subject: `Verify Your Email - ${BRAND_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .code { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; 
                  padding: 20px; background: white; border-radius: 5px; margin: 20px 0; 
                  letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          .warning { color: #d32f2f; margin-top: 15px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for signing up for <strong>${BRAND_NAME}</strong>! To complete your registration, please enter the following verification code:</p>
            <div class="code">${verificationCode}</div>
            <p>This code will expire in ${VERIFICATION_TOKEN_EXPIRY_MINUTES} minutes.</p>
            <p class="warning">⚠️ If you didn't request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${BRAND_SYSTEM_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name},
      
      Thank you for signing up for ${BRAND_NAME}! 
      
      Your verification code is: ${verificationCode}
      
      This code will expire in ${VERIFICATION_TOKEN_EXPIRY_MINUTES} minutes.
      
      If you didn't request this verification, please ignore this email.
      
      © ${new Date().getFullYear()} ${BRAND_SYSTEM_NAME}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, name, resetCode) {
  const isEmailConfigured = EMAIL_USER && 
                            EMAIL_PASS && 
                            EMAIL_USER !== 'your-school-email@school.edu' &&
                            EMAIL_PASS !== 'your-app-password-here';

  // In development or if email not configured, just log the code
  if (process.env.NODE_ENV === 'development' || !isEmailConfigured) {
    console.log(`\n========================================`);
    console.log(`🔒 PASSWORD RESET CODE FOR ${email}`);
    console.log(`CODE: ${resetCode}`);
    console.log(`NAME: ${name}`);
    console.log(`========================================\n`);
    return { success: true, devMode: true };
  }

  if (!transporter) {
    transporter = createTransporter();
  }

  if (!transporter) {
    console.error('Email transporter not configured. Reset code:', resetCode);
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: `"${BRAND_SYSTEM_NAME}" <${EMAIL_FROM}>`,
    to: email,
    subject: `Password Reset Request - ${BRAND_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .code { font-size: 32px; font-weight: bold; color: #f44336; text-align: center; 
                  padding: 20px; background: white; border-radius: 5px; margin: 20px 0; 
                  letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          .warning { color: #d32f2f; margin-top: 15px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your ${BRAND_NAME} password. Please enter the following code to continue:</p>
            <div class="code">${resetCode}</div>
            <p>This code will expire in ${VERIFICATION_TOKEN_EXPIRY_MINUTES} minutes.</p>
            <p class="warning">⚠️ If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${BRAND_SYSTEM_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name},
      
      We received a request to reset your ${BRAND_NAME} password.
      
      Your password reset code is: ${resetCode}
      
      This code will expire in ${VERIFICATION_TOKEN_EXPIRY_MINUTES} minutes.
      
      If you didn't request a password reset, please ignore this email.
      
      © ${new Date().getFullYear()} ${BRAND_SYSTEM_NAME}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

module.exports = {
  isSchoolEmail,
  generateVerificationCode,
  getVerificationExpiry,
  sendVerificationEmail,
  sendPasswordResetEmail,
  ALLOWED_EMAIL_DOMAINS
};
