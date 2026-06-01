import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';

export class LocationController {
  static async createLocation(req: Request, res: Response) {
    try {
      const location = await LocationService.createLocation(req.body);
      res.status(201).json({ success: true, data: location });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getLocations(req: Request, res: Response) {
    try {
      const locations = await LocationService.getLocations();
      res.status(200).json({ success: true, data: locations });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateLocation(req: Request, res: Response) {
    try {
      const { id } = req.params as Record<string, string>;
      const location = await LocationService.updateLocation(id, req.body);
      res.status(200).json({ success: true, data: location });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteLocation(req: Request, res: Response) {
    try {
      const { id } = req.params as Record<string, string>;
      await LocationService.deleteLocation(id);
      res.status(200).json({ success: true, message: 'Location deactivated' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
