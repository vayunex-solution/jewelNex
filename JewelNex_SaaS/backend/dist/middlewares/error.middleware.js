"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const apiResponse_1 = require("../utils/apiResponse");
// ─────────────────────────────────────────
// Global Error Handler Middleware
// Must be registered LAST in app.ts
// Ensures no stack traces leak to client in production
// ─────────────────────────────────────────
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    // Prevent leaking internal error details in production
    const isDev = process.env.NODE_ENV === 'development';
    res
        .status(500)
        .json((0, apiResponse_1.errorResponse)('Internal server error', isDev ? err.message : undefined));
};
exports.errorHandler = errorHandler;
// ─────────────────────────────────────────
// 404 Not Found Handler
// ─────────────────────────────────────────
const notFound = (req, res) => {
    res.status(404).json((0, apiResponse_1.errorResponse)(`Route not found: ${req.method} ${req.path}`));
};
exports.notFound = notFound;
//# sourceMappingURL=error.middleware.js.map