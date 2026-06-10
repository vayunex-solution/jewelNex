"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    SMTP_HOST: zod_1.z.string().min(1, 'SMTP_HOST is required'),
    SMTP_PORT: zod_1.z.string().default('465'),
    SMTP_SECURE: zod_1.z.string().default('true'),
    SMTP_USER: zod_1.z.string().min(1, 'SMTP_USER is required'),
    SMTP_PASS: zod_1.z.string().min(1, 'SMTP_PASS is required'),
    SMTP_FROM: zod_1.z.string().min(1, 'SMTP_FROM is required'),
    APP_URL: zod_1.z.string().default('http://localhost:5000'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:5173'),
    CORS_ORIGINS: zod_1.z.string().default('http://localhost:5173'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map