"use strict";
// ─────────────────────────────────────────
// Standard API Response Utilities
// All API responses go through these helpers
// for consistent structure across all endpoints
// ─────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (message, data) => ({
    success: true,
    message,
    data,
});
exports.successResponse = successResponse;
const errorResponse = (message, error) => ({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
});
exports.errorResponse = errorResponse;
//# sourceMappingURL=apiResponse.js.map