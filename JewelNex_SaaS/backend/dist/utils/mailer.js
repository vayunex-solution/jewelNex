"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.SMTP_HOST,
    port: Number(env_1.env.SMTP_PORT),
    secure: env_1.env.SMTP_SECURE === 'true' || Number(env_1.env.SMTP_PORT) === 465, // true for port 465 (SSL)
    auth: {
        user: env_1.env.SMTP_USER,
        pass: env_1.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false, // allow self-signed certs on cPanel SMTP
    },
});
const sendMail = async (options) => {
    await transporter.sendMail({
        from: env_1.env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
    });
};
exports.sendMail = sendMail;
//# sourceMappingURL=mailer.js.map