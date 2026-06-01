import api from '../lib/api';

export interface InventoryLocation {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'STORE' | 'SUPPLIER' | 'CUSTOMER';
  isActive: boolean;
  createdAt: string;
}

export const locationService = {
  getLocations: async () => {
    const response = await api.get('/locations');
    return response.data;
  },

  createLocation: async (data: Partial<InventoryLocation>) => {
    const response = await api.post('/locations', data);
    return response.data;
  },

  updateLocation: async (id: string, data: Partial<InventoryLocation>) => {
    const response = await api.put(`/locations/${id}`, data);
    return response.data;
  },

  deleteLocation: async (id: string) => {
    const response = await api.delete(`/locations/${id}`);
    return response.data;
  },
};
