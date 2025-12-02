const { isSchoolEmail } = require('../utils/emailService');

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateSchoolEmail = (email) => {
  return validateEmail(email) && isSchoolEmail(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password && password.length >= 8;
};

const sanitizeString = (str, maxLength = 255) => {
  if (!str) return '';
  return String(str).trim().slice(0, maxLength);
};

const validateUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const validateNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

module.exports = {
  validateEmail,
  validateSchoolEmail,
  validatePassword,
  sanitizeString,
  validateUUID,
  validateNumber
};
