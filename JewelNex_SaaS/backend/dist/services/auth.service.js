"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordService = exports.forgotPasswordService = exports.loginService = exports.resendOTPService = exports.verifyOTPService = exports.signupService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const env_1 = require("../config/env");
const mailer_1 = require("../utils/mailer");
const tokenGenerator_1 = require("../utils/tokenGenerator");
const templates_1 = require("../emails/templates");
// ─────────────────────────────────────────
// AUTH SERVICE
// All business logic lives here.
// Controllers call this — never Prisma directly.
// ─────────────────────────────────────────
const SALT_ROUNDS = 12;
// Helper: Map user+role to safe UserResponseDto
const toUserDto = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    isVerified: user.isVerified,
    companyId: user.companyId,
});
// Custom Error class to carry codes
class AuthError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'AuthError';
        this.code = code;
    }
}
// ─────────────────────────────────────────
// SIGNUP SERVICE
// ─────────────────────────────────────────
const signupService = async (data) => {
    const existing = await database_1.default.user.findUnique({ where: { email: data.email } });
    if (existing) {
        if (!existing.isVerified) {
            // Resend OTP for unverified existing account
            const verificationToken = (0, tokenGenerator_1.generateOTP)();
            const verificationTokenExpiry = (0, tokenGenerator_1.generateTokenExpiry)(24);
            await database_1.default.user.update({
                where: { id: existing.id },
                data: { verificationToken, verificationTokenExpiry }
            });
            (0, mailer_1.sendMail)({
                to: data.email,
                subject: 'Verify Your JewelNex Account',
                html: (0, templates_1.verificationEmailTemplate)(existing.name, verificationToken),
            }).catch((error) => { });
            return { message: 'Account exists but is not verified. A new OTP has been sent to your email.' };
        }
        throw new AuthError('An account with this email already exists');
    }
    const hashedPassword = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
    let role = await database_1.default.role.findFirst({ where: { name: 'admin' } });
    if (!role) {
        role = await database_1.default.role.create({ data: { name: 'admin' } });
    }
    const verificationToken = (0, tokenGenerator_1.generateOTP)();
    const verificationTokenExpiry = (0, tokenGenerator_1.generateTokenExpiry)(24);
    // Automatically create a new Company for the new admin registration
    const company = await database_1.default.company.create({
        data: {
            name: `${data.name}'s Store`,
        },
    });
    // Seed default settings for the company
    await database_1.default.companySettings.create({
        data: {
            companyId: company.id,
            name: `${data.name}'s Store`,
        },
    });
    const user = await database_1.default.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            roleId: role.id,
            companyId: company.id,
            verificationToken,
            verificationTokenExpiry,
        },
        include: { role: true },
    });
    await database_1.default.activityLog.create({
        data: { userId: user.id, action: 'SIGNUP', metadata: { email: data.email } },
    });
    (0, mailer_1.sendMail)({
        to: data.email,
        subject: 'Verify Your JewelNex Account',
        html: (0, templates_1.verificationEmailTemplate)(data.name, verificationToken),
    }).catch((error) => {
        // Silently fail mail send on signup to not block user creation
    });
    return { message: 'Account created! Please check your email for the OTP to verify your account.' };
};
exports.signupService = signupService;
// ─────────────────────────────────────────
// VERIFY OTP SERVICE
// ─────────────────────────────────────────
const verifyOTPService = async (data) => {
    const user = await database_1.default.user.findFirst({
        where: {
            email: data.email,
            verificationToken: data.otp,
            verificationTokenExpiry: { gt: new Date() },
        },
    });
    if (!user) {
        throw new AuthError('Invalid or expired OTP');
    }
    await database_1.default.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verificationToken: null,
            verificationTokenExpiry: null,
        },
    });
    await database_1.default.activityLog.create({
        data: { userId: user.id, action: 'VERIFY_EMAIL' },
    });
    return { message: 'Email verified successfully. You can now log in.' };
};
exports.verifyOTPService = verifyOTPService;
// ─────────────────────────────────────────
// RESEND OTP SERVICE
// ─────────────────────────────────────────
const resendOTPService = async (data) => {
    const user = await database_1.default.user.findUnique({ where: { email: data.email } });
    if (!user) {
        // Silent success to prevent enumeration
        return { message: 'If your account exists and is unverified, a new OTP has been sent.' };
    }
    if (user.isVerified) {
        throw new AuthError('Account is already verified.');
    }
    const verificationToken = (0, tokenGenerator_1.generateOTP)();
    const verificationTokenExpiry = (0, tokenGenerator_1.generateTokenExpiry)(24);
    await database_1.default.user.update({
        where: { id: user.id },
        data: { verificationToken, verificationTokenExpiry },
    });
    (0, mailer_1.sendMail)({
        to: data.email,
        subject: 'Verify Your JewelNex Account',
        html: (0, templates_1.verificationEmailTemplate)(user.name, verificationToken),
    }).catch((error) => { });
    return { message: 'If your account exists and is unverified, a new OTP has been sent.' };
};
exports.resendOTPService = resendOTPService;
// ─────────────────────────────────────────
// LOGIN SERVICE
// ─────────────────────────────────────────
const loginService = async (data) => {
    const user = await database_1.default.user.findUnique({
        where: { email: data.email },
        include: { role: true },
    });
    if (!user) {
        throw new AuthError('Invalid email or password');
    }
    if (!user.isVerified) {
        // Optionally trigger an OTP resend here automatically
        const verificationToken = (0, tokenGenerator_1.generateOTP)();
        const verificationTokenExpiry = (0, tokenGenerator_1.generateTokenExpiry)(24);
        await database_1.default.user.update({
            where: { id: user.id },
            data: { verificationToken, verificationTokenExpiry },
        });
        (0, mailer_1.sendMail)({
            to: user.email,
            subject: 'Verify Your JewelNex Account',
            html: (0, templates_1.verificationEmailTemplate)(user.name, verificationToken),
        }).catch((e) => { });
        throw new AuthError('Please verify your email before logging in. A new OTP has been sent.', 'UNVERIFIED');
    }
    if (!user.isActive) {
        throw new AuthError('Your account has been deactivated. Please contact support.');
    }
    const isMatch = await bcrypt_1.default.compare(data.password, user.password);
    if (!isMatch) {
        throw new AuthError('Invalid email or password');
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role.name, companyId: user.companyId }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
    await database_1.default.activityLog.create({
        data: { userId: user.id, action: 'LOGIN' },
    });
    return { token, user: toUserDto(user) };
};
exports.loginService = loginService;
// ─────────────────────────────────────────
// FORGOT PASSWORD SERVICE
// ─────────────────────────────────────────
const forgotPasswordService = async (data) => {
    const user = await database_1.default.user.findUnique({ where: { email: data.email }, include: { role: true } });
    if (!user) {
        return { message: 'If an account exists with this email, an OTP has been sent.' };
    }
    const resetToken = (0, tokenGenerator_1.generateOTP)();
    const resetTokenExpiry = (0, tokenGenerator_1.generateTokenExpiry)(1); // 1 hour
    await database_1.default.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
    });
    await database_1.default.activityLog.create({
        data: { userId: user.id, action: 'FORGOT_PASSWORD' },
    });
    (0, mailer_1.sendMail)({
        to: data.email,
        subject: 'Reset Your JewelNex Password',
        html: (0, templates_1.resetPasswordEmailTemplate)(user.name, resetToken),
    }).catch((error) => { });
    return { message: 'If an account exists with this email, an OTP has been sent.' };
};
exports.forgotPasswordService = forgotPasswordService;
// ─────────────────────────────────────────
// RESET PASSWORD SERVICE
// ─────────────────────────────────────────
const resetPasswordService = async (data) => {
    const user = await database_1.default.user.findFirst({
        where: {
            email: data.email,
            resetToken: data.otp,
            resetTokenExpiry: { gt: new Date() },
        },
    });
    if (!user) {
        throw new AuthError('Invalid or expired OTP');
    }
    const hashedPassword = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
    await database_1.default.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });
    await database_1.default.activityLog.create({
        data: { userId: user.id, action: 'RESET_PASSWORD' },
    });
    return { message: 'Password reset successfully. You can now log in with your new password.' };
};
exports.resetPasswordService = resetPasswordService;
//# sourceMappingURL=auth.service.js.map