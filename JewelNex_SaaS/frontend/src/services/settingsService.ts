import api from '../lib/api';

export interface CompanySettings {
  id: string;
  name: string;
  tagline?: string;
  gstin?: string;
  panNumber?: string;
  address?: string;
  city?: string;
  state: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoBase64?: string;
  gstType: string;
  currencySymbol: string;
  invoicePrefix?: string;
  invoiceFooter?: string;
}

export const settingsService = {
  getCompanySettings: async (): Promise<CompanySettings> => {
    const res = await api.get('/settings/company');
    return res.data.data;
  },

  updateCompanySettings: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
    const res = await api.put('/settings/company', data);
    return res.data.data;
  },
};
