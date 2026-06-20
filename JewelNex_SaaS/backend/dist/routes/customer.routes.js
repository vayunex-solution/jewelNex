"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', customer_controller_1.CustomerController.createCustomer);
router.get('/search', customer_controller_1.CustomerController.searchCustomers);
router.get('/', customer_controller_1.CustomerController.searchCustomers);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map