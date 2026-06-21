"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.resendOTP = exports.verifyOTP = exports.login = exports.signup = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const auth_service_1 = require("../services/auth.service");
// ─────────────────────────────────────────
// AUTH CONTROLLER
// Thin controller — ONLY delegates to service
// No business logic here!
// ─────────────────────────────────────────
const signup = async (req, res) => {
    try {
        const result = await (0, auth_service_1.signupService)(req.body);
        res.status(201).json((0, apiResponse_1.successResponse)(result.message));
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Signup failed';
        res.status(400).json((0, apiResponse_1.errorResponse)(message));
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const result = await (0, auth_service_1.loginService)(req.body);
        res.status(200).json((0, apiResponse_1.successResponse)('Login successful', result));
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        const code = err?.code || 'UNAUTHORIZED';
        res.status(401).json({ success: false, message, code });
    }
};
exports.login = login;
const verifyOTP = async (req, res) => {
    try {
        console.log('Verify OTP Request Body:', req.body);
        const result = await (0, auth_service_1.verifyOTPService)(req.body);
        res.status(200).json((0, apiResponse_1.successResponse)(result.message));
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Verification failed';
        console.error('Verify OTP Error:', message);
        res.status(400).json((0, apiResponse_1.errorResponse)(message));
    }
};
exports.verifyOTP = verifyOTP;
const resendOTP = async (req, res) => {
    try {
        const result = await (0, auth_service_1.resendOTPService)(req.body);
        res.status(200).json((0, apiResponse_1.successResponse)(result.message));
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to resend OTP';
        res.status(400).json((0, apiResponse_1.errorResponse)(message));
    }
};
exports.resendOTP = resendOTP;
const forgotPassword = async (req, res) => {
    try {
        const result = await (0, auth_service_1.forgotPasswordService)(req.body);
        res.status(200).json((0, apiResponse_1.successResponse)(result.message));
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Request failed';
        res.status(400).json((0, apiResponse_1.errorResponse)(message));
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const result = await (0, auth_service_1.resetPasswordService)(req.body);
        res.status(200).json((0, apiResponse_1.successResponse)(result.message));
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Reset failed';
        res.status(400).json((0, apiResponse_1.errorResponse)(message));
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.controller.js.map