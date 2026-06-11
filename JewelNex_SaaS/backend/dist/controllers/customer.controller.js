"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const customer_service_1 = require("../services/customer.service");
class CustomerController {
    static async createCustomer(req, res, next) {
        try {
            // @ts-ignore
            const companyId = req.user?.companyId;
            if (!companyId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
            }
            const customer = await customer_service_1.CustomerService.createCustomer(req.body, companyId);
            res.status(201).json({ success: true, data: customer });
        }
        catch (error) {
            next(error);
        }
    }
    static async searchCustomers(req, res, next) {
        try {
            const { q } = req.query;
            // @ts-ignore
            const companyId = req.user?.companyId;
            const customers = await customer_service_1.CustomerService.searchCustomers(String(q || ''), companyId);
            res.status(200).json({ success: true, data: customers });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
//# sourceMappingURL=customer.controller.js.map