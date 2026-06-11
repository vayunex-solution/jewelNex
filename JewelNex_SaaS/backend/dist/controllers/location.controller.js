"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const location_service_1 = require("../services/location.service");
class LocationController {
    static async createLocation(req, res) {
        try {
            // @ts-ignore
            const companyId = req.user?.companyId;
            if (!companyId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
            }
            const location = await location_service_1.LocationService.createLocation(req.body, companyId);
            res.status(201).json({ success: true, data: location });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getLocations(req, res) {
        try {
            // @ts-ignore
            const companyId = req.user?.companyId;
            const locations = await location_service_1.LocationService.getLocations(companyId);
            res.status(200).json({ success: true, data: locations });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async updateLocation(req, res) {
        try {
            const { id } = req.params;
            // @ts-ignore
            const companyId = req.user?.companyId;
            const location = await location_service_1.LocationService.updateLocation(id, req.body, companyId);
            res.status(200).json({ success: true, data: location });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async deleteLocation(req, res) {
        try {
            const { id } = req.params;
            // @ts-ignore
            const companyId = req.user?.companyId;
            await location_service_1.LocationService.deleteLocation(id, companyId);
            res.status(200).json({ success: true, message: 'Location deactivated' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.LocationController = LocationController;
//# sourceMappingURL=location.controller.js.map