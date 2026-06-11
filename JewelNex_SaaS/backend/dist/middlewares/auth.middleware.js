"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const apiResponse_1 = require("../utils/apiResponse");
const database_1 = __importDefault(require("../config/database"));
// ─────────────────────────────────────────
// JWT Authentication Middleware
// ─────────────────────────────────────────
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Also accept ?token= query param for browser-triggered file downloads (PDF, XLSX, CSV)
        const queryToken = req.query?.token;
        if (!authHeader?.startsWith('Bearer ') && !queryToken) {
            res.status(401).json((0, apiResponse_1.errorResponse)('Unauthorized: No token provided'));
            return;
        }
        const token = queryToken ?? authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        // Verify user still exists and is active
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, isActive: true, companyId: true, role: { select: { name: true } } },
        });
        if (!user || !user.isActive) {
            res.status(401).json((0, apiResponse_1.errorResponse)('Unauthorized: Account not found or inactive'));
            return;
        }
        req.user = { id: user.id, userId: user.id, email: user.email, role: user.role.name, companyId: user.companyId };
        next();
    }
    catch {
        res.status(401).json((0, apiResponse_1.errorResponse)('Unauthorized: Invalid or expired token'));
    }
};
exports.authenticate = authenticate;
// ─────────────────────────────────────────
// RBAC Middleware — Authorize Roles
// Usage: authorize('admin', 'superadmin')
// ─────────────────────────────────────────
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json((0, apiResponse_1.errorResponse)('Forbidden: Insufficient permissions'));
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map