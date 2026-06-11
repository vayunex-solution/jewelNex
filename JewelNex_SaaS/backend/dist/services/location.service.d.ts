export declare class LocationService {
    static createLocation(data: {
        name: string;
        type: string;
    }, companyId: string): Promise<{
        id: string;
        name: string;
        type: string;
        companyId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static getLocations(companyId?: string): Promise<{
        id: string;
        name: string;
        type: string;
        companyId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    static updateLocation(id: string, data: any, companyId?: string): Promise<{
        id: string;
        name: string;
        type: string;
        companyId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static deleteLocation(id: string, companyId?: string): Promise<{
        id: string;
        name: string;
        type: string;
        companyId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=location.service.d.ts.map