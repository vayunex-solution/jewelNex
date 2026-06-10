"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const apiResponse_1 = require("../utils/apiResponse");
// ─────────────────────────────────────────
// Validate Request Body Middleware (Zod)
// Usage: validate(mySchema)
// ─────────────────────────────────────────
const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
            res.status(400).json((0, apiResponse_1.errorResponse)('Validation failed', errors.join(', ')));
            return;
        }
        req.body = result.data; // Replace with sanitized, validated data
        next();
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.middleware.js.map