"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokenExpiry = exports.generateOTP = exports.generateToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
// Generate a cryptographically secure random token
const generateToken = (length = 64) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
exports.generateToken = generateToken;
// Generate a 6-digit numeric OTP
const generateOTP = () => {
    return crypto_1.default.randomInt(100000, 999999).toString();
};
exports.generateOTP = generateOTP;
// Generate token expiry date (default 24 hours)
const generateTokenExpiry = (hours = 24) => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    return expiry;
};
exports.generateTokenExpiry = generateTokenExpiry;
//# sourceMappingURL=tokenGenerator.js.map