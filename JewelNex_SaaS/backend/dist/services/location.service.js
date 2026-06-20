"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const database_1 = __importDefault(require("../config/database"));
class LocationService {
    static async createLocation(data, companyId) {
        return database_1.default.location.create({
            data: {
                ...data,
                companyId,
            },
        });
    }
    static async getLocations(companyId) {
        return database_1.default.location.findMany({
            where: {
                isActive: true,
                companyId: companyId || 'NO_COMPANY_ACCESS',
            },
            orderBy: { name: 'asc' },
        });
    }
    static async updateLocation(id, data, companyId) {
        return database_1.default.location.update({
            where: { id, companyId: companyId || 'NO_COMPANY_ACCESS' },
            data,
        });
    }
    static async deleteLocation(id, companyId) {
        return database_1.default.location.update({
            where: { id, companyId: companyId || 'NO_COMPANY_ACCESS' },
            data: { isActive: false },
        });
    }
}
exports.LocationService = LocationService;
//# sourceMappingURL=location.service.js.map