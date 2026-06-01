import crypto from 'crypto';

// Generate a cryptographically secure random token
export const generateToken = (length = 64): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate a 6-digit numeric OTP
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate token expiry date (default 24 hours)
export const generateTokenExpiry = (hours = 24): Date => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
};
