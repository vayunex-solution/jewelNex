"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controllers/location.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), location_controller_1.LocationController.createLocation);
router.get('/', auth_middleware_1.authenticate, location_controller_1.LocationController.getLocations);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), location_controller_1.LocationController.updateLocation);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), location_controller_1.LocationController.deleteLocation);
exports.default = router;
//# sourceMappingURL=location.routes.js.map