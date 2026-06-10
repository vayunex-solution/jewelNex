export declare class LocationService {
    static createLocation(data: {
        name: string;
        type: string;
    }): Promise<{
        id: string;
        name: string;
        type: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static getLocations(): Promise<{
        id: string;
        name: string;
        type: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    static updateLocation(id: string, data: any): Promise<{
        id: string;
        name: string;
        type: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static deleteLocation(id: string): Promise<{
        id: string;
        name: string;
        type: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=location.service.d.ts.map