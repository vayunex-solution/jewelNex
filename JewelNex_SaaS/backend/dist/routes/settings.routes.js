"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/v1/settings/company
router.get('/company', settings_controller_1.SettingsController.getSettings);
// PUT /api/v1/settings/company
router.put('/company', (0, auth_middleware_1.authorize)('admin'), settings_controller_1.SettingsController.updateSettings);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map