import { Decimal } from '@prisma/client/runtime/library';
export interface TaxCalculationParams {
    amount: number | Decimal;
    gstPercent: number | Decimal;
    isInterstate?: boolean;
}
export interface TaxBreakdown {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    totalWithTax: number;
}
export declare class TaxService {
    /**
     * Calculates the GST breakdown (CGST/SGST vs IGST) for a given amount and rate.
     * Uses standard rounding rules for accounting.
     */
    static calculateGST(params: TaxCalculationParams): TaxBreakdown;
    /**
     * Fetches the default HSN code for a given purity.
     * This is a simplified abstraction; in production, this could query an HSN database.
     */
    static getDefaultHSN(purity: number | Decimal): string;
}
//# sourceMappingURL=tax.service.d.ts.map