import api from '../lib/api';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  purity: number;
  fineWeight: number;
  wastagePercent: number;
  makingCharge: number;
  isActive: boolean;
  createdAt: string;
  lots?: Array<{
    id: string;
    quantity: number;
    weight: number;
    status: string;
    locationId?: string;
  }>;
}

export interface StockMovementPayload {
  productId: string;
  lotId?: string;
  transactionId?: string;
  type: 'OPENING' | 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT';
  fromLocationId?: string;
  toLocationId?: string;
  quantityDelta: number;
  weightDelta: number;
}

export const inventoryService = {
  getProducts: async (skip = 0, take = 50) => {
    const response = await api.get(`/inventory/products?skip=${skip}&take=${take}`);
    return response.data;
  },

  createProduct: async (data: Partial<Product>) => {
    const response = await api.post('/inventory/products', data);
    return response.data;
  },

  recordMovement: async (data: StockMovementPayload) => {
    const response = await api.post('/inventory/movements', data);
    return response.data;
  },

  transferStock: async (data: Record<string, unknown>) => {
    const response = await api.post('/inventory/transfer', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/inventory/stats');
    return response.data;
  },
};
