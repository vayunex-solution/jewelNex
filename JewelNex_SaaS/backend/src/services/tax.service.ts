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

export class TaxService {
  /**
   * Calculates the GST breakdown (CGST/SGST vs IGST) for a given amount and rate.
   * Uses standard rounding rules for accounting.
   */
  static calculateGST(params: TaxCalculationParams): TaxBreakdown {
    const amountVal = typeof params.amount === 'number' ? params.amount : params.amount.toNumber();
    const rateVal = typeof params.gstPercent === 'number' ? params.gstPercent : params.gstPercent.toNumber();
    
    // Total Tax
    const totalTax = (amountVal * rateVal) / 100;
    const roundedTax = Number(totalTax.toFixed(2));
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (params.isInterstate) {
      igst = roundedTax;
    } else {
      // Split evenly into CGST and SGST
      const halfTax = (amountVal * (rateVal / 2)) / 100;
      cgst = Number(halfTax.toFixed(2));
      sgst = Number(halfTax.toFixed(2));
      
      // Handle potential 1 paisa rounding difference
      if (cgst + sgst !== roundedTax) {
        cgst = Number((roundedTax - sgst).toFixed(2));
      }
    }

    return {
      cgst,
      sgst,
      igst,
      totalTax: roundedTax,
      totalWithTax: Number((amountVal + roundedTax).toFixed(2))
    };
  }

  /**
   * Fetches the default HSN code for a given purity.
   * This is a simplified abstraction; in production, this could query an HSN database.
   */
  static getDefaultHSN(purity: number | Decimal): string {
    const p = typeof purity === 'number' ? purity : purity.toNumber();
    // 7113 is Articles of jewellery and parts thereof
    // 7108 is Gold unwrought or in semi-manufactured forms
    if (p >= 0.999) return '71081200'; // Fine Gold
    return '71131910'; // Gold Jewellery
  }
}
