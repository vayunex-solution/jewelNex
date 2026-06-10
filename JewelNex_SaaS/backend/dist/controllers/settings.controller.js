"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const settings_service_1 = require("../services/settings.service");
class SettingsController {
    static async getSettings(req, res, next) {
        try {
            const settings = await settings_service_1.SettingsService.getSettings();
            res.status(200).json({ success: true, data: settings });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateSettings(req, res, next) {
        try {
            const settings = await settings_service_1.SettingsService.updateSettings(req.body);
            res.status(200).json({ success: true, data: settings, message: 'Company settings updated.' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settings.controller.js.map