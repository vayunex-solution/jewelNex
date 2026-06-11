import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';

export class LocationController {
  static async createLocation(req: Request, res: Response) {
    try {
      // @ts-ignore
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
      }
      const location = await LocationService.createLocation(req.body, companyId);
      res.status(201).json({ success: true, data: location });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getLocations(req: Request, res: Response) {
    try {
      // @ts-ignore
      const companyId = req.user?.companyId;
      const locations = await LocationService.getLocations(companyId);
      res.status(200).json({ success: true, data: locations });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateLocation(req: Request, res: Response) {
    try {
      const { id } = req.params as Record<string, string>;
      // @ts-ignore
      const companyId = req.user?.companyId;
      const location = await LocationService.updateLocation(id, req.body, companyId);
      res.status(200).json({ success: true, data: location });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteLocation(req: Request, res: Response) {
    try {
      const { id } = req.params as Record<string, string>;
      // @ts-ignore
      const companyId = req.user?.companyId;
      await LocationService.deleteLocation(id, companyId);
      res.status(200).json({ success: true, message: 'Location deactivated' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
