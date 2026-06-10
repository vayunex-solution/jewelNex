"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const accounting_routes_1 = __importDefault(require("./routes/accounting.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const export_routes_1 = __importDefault(require("./routes/export.routes"));
const auditlog_routes_1 = __importDefault(require("./routes/auditlog.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
// ─── 1. Security Headers ─────────────────
app.use((0, helmet_1.default)());
// ─── 2. CORS Configuration ──────────────
const allowedOrigins = (env_1.env.CORS_ORIGINS || '').split(',');
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// ─── 3. Request Parsing ──────────────────
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ─── 5. Health Check ──────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// ─── 6. API Routes (v1) ──────────────────
app.get('/api/v1', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'JewelNex SaaS API v1 is running',
        version: '1.0.0',
        documentation: 'https://github.com/Sandeep-Ynr/JewelNex'
    });
});
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/inventory', inventory_routes_1.default);
app.use('/api/v1/locations', location_routes_1.default);
app.use('/api/v1/invoices', invoice_routes_1.default);
app.use('/api/v1/customers', customer_routes_1.default);
app.use('/api/v1/accounting', accounting_routes_1.default);
app.use('/api/v1/settings', settings_routes_1.default);
app.use('/api/v1/export', export_routes_1.default);
app.use('/api/v1/audit-logs', auditlog_routes_1.default);
// ─── 7. 404 Handler ──────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
// ─── 8. Global Error Handler ─────────────
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map