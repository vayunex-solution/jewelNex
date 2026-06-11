import { Request, Response } from 'express';
export declare class LocationController {
    static createLocation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getLocations(req: Request, res: Response): Promise<void>;
    static updateLocation(req: Request, res: Response): Promise<void>;
    static deleteLocation(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=location.controller.d.ts.map