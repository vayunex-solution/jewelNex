import prisma from '../config/database';

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

export class SettingsService {
  /**
   * Gets (or creates) the singleton company settings row.
   */
  static async getSettings() {
    return await prisma.companySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
  }

  /**
   * Updates company settings.
   */
  static async updateSettings(dto: CompanySettingsDTO) {
    return await prisma.companySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...dto },
      update: dto,
    });
  }
}
