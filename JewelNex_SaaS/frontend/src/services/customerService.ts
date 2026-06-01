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
    const response = await api.post('/customers', data);
    return response.data;
  },
};
