export interface CompanySettingsDTO {
    name?: string;
    tagline?: string;
    gstin?: string;
    panNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoBase64?: string;
    gstType?: string;
    currencySymbol?: string;
    invoicePrefix?: string;
    invoiceFooter?: string;
}
export declare class SettingsService {
    /**
     * Gets (or creates) the singleton company settings row.
     */
    static getSettings(): Promise<{
        id: string;
        name: string;
        tagline: string | null;
        gstin: string | null;
        panNumber: string | null;
        address: string | null;
        city: string | null;
        state: string;
        pincode: string | null;
        phone: string | null;
        email: string | null;
        website: string | null;
        logoBase64: string | null;
        gstType: string;
        currencySymbol: string;
        invoicePrefix: string | null;
        invoiceFooter: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Updates company settings.
     */
    static updateSettings(dto: CompanySettingsDTO): Promise<{
        id: string;
        name: string;
        tagline: string | null;
        gstin: string | null;
        panNumber: string | null;
        address: string | null;
        city: string | null;
        state: string;
        pincode: string | null;
        phone: string | null;
        email: string | null;
        website: string | null;
        logoBase64: string | null;
        gstType: string;
        currencySymbol: string;
        invoicePrefix: string | null;
        invoiceFooter: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=settings.service.d.ts.map