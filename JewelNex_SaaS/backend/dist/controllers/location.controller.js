"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const location_service_1 = require("../services/location.service");
class LocationController {
    static async createLocation(req, res) {
        try {
            const location = await location_service_1.LocationService.createLocation(req.body);
            res.status(201).json({ success: true, data: location });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getLocations(req, res) {
        try {
            const locations = await location_service_1.LocationService.getLocations();
            res.status(200).json({ success: true, data: locations });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async updateLocation(req, res) {
        try {
            const { id } = req.params;
            const location = await location_service_1.LocationService.updateLocation(id, req.body);
            res.status(200).json({ success: true, data: location });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async deleteLocation(req, res) {
        try {
            const { id } = req.params;
            await location_service_1.LocationService.deleteLocation(id);
            res.status(200).json({ success: true, message: 'Location deactivated' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.LocationController = LocationController;
//# sourceMappingURL=location.controller.js.map