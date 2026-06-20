import api from '../lib/api';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
  panNumber?: string;
  isActive: boolean;
}

export const customerService = {
  searchCustomers: async (q: string) => {
    const response = await api.get(`/customers?q=${encodeURIComponent(q)}`);
    return response.data;
  },

  createCustomer: async (data: Partial<Customer>) => {
    // Sanitize optional fields to avoid composite unique index conflicts for empty strings
    const sanitized = {
      ...data,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      gstNumber: data.gstNumber?.trim() || null,
      address: data.address?.trim() || null,
      panNumber: data.panNumber?.trim() || null,
    };
    const response = await api.post('/customers', sanitized);
    return response.data;
  },
};
