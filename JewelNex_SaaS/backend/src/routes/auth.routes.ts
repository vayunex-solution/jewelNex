import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, verifyOTP, resendOTP, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { signupSchema, loginSchema, verifyOTPSchema, resendOTPSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';

const router = Router();

// ─────────────────────────────────────────
// Rate Limiters
// ─────────────────────────────────────────

const isTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const loginLimiter = isTest ? (req: any, res: any, next: any) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
});

const signupLimiter = isTest ? (req: any, res: any, next: any) => next() : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many signup attempts, please try again after an hour' },
});

const otpLimiter = isTest ? (req: any, res: any, next: any) => next() : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many OTP requests, please try again after an hour' },
});

// ─────────────────────────────────────────
// Auth Routes — /api/v1/auth
// ─────────────────────────────────────────

// POST /api/v1/auth/signup
router.post('/signup', signupLimiter, validate(signupSchema), signup);

// POST /api/v1/auth/login
router.post('/login', loginLimiter, validate(loginSchema), login);

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', validate(verifyOTPSchema), verifyOTP);

// POST /api/v1/auth/resend-otp
router.post('/resend-otp', otpLimiter, validate(resendOTPSchema), resendOTP);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
