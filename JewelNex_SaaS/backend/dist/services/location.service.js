"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const database_1 = __importDefault(require("../config/database"));
class LocationService {
    static async createLocation(data) {
        return database_1.default.location.create({
            data,
        });
    }
    static async getLocations() {
        return database_1.default.location.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    static async updateLocation(id, data) {
        return database_1.default.location.update({
            where: { id },
            data,
        });
    }
    static async deleteLocation(id) {
        return database_1.default.location.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
exports.LocationService = LocationService;
//# sourceMappingURL=location.service.js.map