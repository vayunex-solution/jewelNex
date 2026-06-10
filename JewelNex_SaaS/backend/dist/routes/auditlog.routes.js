"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditlog_controller_1 = require("../controllers/auditlog.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/v1/audit-logs?entity=invoice&action=POST&page=1&limit=25
router.get('/', auditlog_controller_1.AuditLogController.list);
// POST /api/v1/audit-logs  (internal — log an event manually)
router.post('/', auditlog_controller_1.AuditLogController.create);
exports.default = router;
//# sourceMappingURL=auditlog.routes.js.map