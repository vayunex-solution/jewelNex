"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// Rate Limiters
// ─────────────────────────────────────────
const isTest = process.env.NODE_ENV === 'test';
const loginLimiter = isTest ? (req, res, next) => next() : (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
});
const signupLimiter = isTest ? (req, res, next) => next() : (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { success: false, message: 'Too many signup attempts, please try again after an hour' },
});
const otpLimiter = isTest ? (req, res, next) => next() : (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { success: false, message: 'Too many OTP requests, please try again after an hour' },
});
// ─────────────────────────────────────────
// Auth Routes — /api/v1/auth
// ─────────────────────────────────────────
// POST /api/v1/auth/signup
router.post('/signup', signupLimiter, (0, validate_middleware_1.validate)(auth_validator_1.signupSchema), auth_controller_1.signup);
// POST /api/v1/auth/login
router.post('/login', loginLimiter, (0, validate_middleware_1.validate)(auth_validator_1.loginSchema), auth_controller_1.login);
// POST /api/v1/auth/verify-otp
router.post('/verify-otp', (0, validate_middleware_1.validate)(auth_validator_1.verifyOTPSchema), auth_controller_1.verifyOTP);
// POST /api/v1/auth/resend-otp
router.post('/resend-otp', otpLimiter, (0, validate_middleware_1.validate)(auth_validator_1.resendOTPSchema), auth_controller_1.resendOTP);
// POST /api/v1/auth/forgot-password
router.post('/forgot-password', otpLimiter, (0, validate_middleware_1.validate)(auth_validator_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
// POST /api/v1/auth/reset-password
router.post('/reset-password', (0, validate_middleware_1.validate)(auth_validator_1.resetPasswordSchema), auth_controller_1.resetPassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map