"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const database_1 = __importDefault(require("../config/database"));
const accounting_service_1 = require("./accounting.service");
class CustomerService {
    static async createCustomer(data, companyId) {
        return await database_1.default.$transaction(async (tx) => {
            const customer = await tx.customer.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    gstNumber: data.gstNumber,
                    address: data.address,
                    companyId
                }
            });
            // Automatically register Customer's AccountHead
            await accounting_service_1.AccountingService.getOrCreateCustomerHead(customer.id, customer.name, tx);
            return customer;
        });
    }
    static async searchCustomers(query, companyId) {
        return await database_1.default.customer.findMany({
            where: {
                companyId: companyId || undefined,
                OR: [
                    { name: { contains: query } },
                    { phone: { contains: query } }
                ]
            },
            take: 10
        });
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer.service.js.map