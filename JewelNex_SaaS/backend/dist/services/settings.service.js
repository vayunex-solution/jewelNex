"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const database_1 = __importDefault(require("../config/database"));
class SettingsService {
    /**
     * Gets (or creates) the singleton company settings row.
     */
    static async getSettings() {
        return await database_1.default.companySettings.upsert({
            where: { id: 'default' },
            create: { id: 'default' },
            update: {},
        });
    }
    /**
     * Updates company settings.
     */
    static async updateSettings(dto) {
        return await database_1.default.companySettings.upsert({
            where: { id: 'default' },
            create: { id: 'default', ...dto },
            update: dto,
        });
    }
}
exports.SettingsService = SettingsService;
//# sourceMappingURL=settings.service.js.map