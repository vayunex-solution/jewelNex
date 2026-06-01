import api from '../lib/api';

export interface InvoiceItemPayload {
  productId: string;
  lotId?: string;
  quantity: number;
  weight: number;
  rate: number;
  purity: number;
  makingCharge: number;
  wastage: number;
  hsn?: string;
  discountPercent: number;
  gstPercent: number;
  amount: number;
}

export interface InvoicePaymentPayload {
  amount: number;
  mode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'BANK_TRANSFER' | 'CHEQUE';
  referenceId?: string;
}

export interface InvoicePayload {
  type: 'SALE' | 'PURCHASE';
  customerId: string;
  notes?: string;
  items: InvoiceItemPayload[];
  payments?: InvoicePaymentPayload[];
  subTotal: number;
  taxTotal: number;
  discount: number;
  grandTotal: number;
}

export const invoiceService = {
  getDrafts: async () => {
    const response = await api.get('/invoices/drafts');
    return response.data;
  },

  saveDraft: async (data: InvoicePayload) => {
    const response = await api.post('/invoices/draft', data);
    return response.data;
  },

  editDraft: async (id: string, data: InvoicePayload) => {
    const response = await api.put(`/invoices/draft/${id}`, data);
    return response.data;
  },

  postDraft: async (id: string, payments: InvoicePaymentPayload[]) => {
    const response = await api.post(`/invoices/draft/${id}/post`, { payments });
    return response.data;
  },

  postInvoice: async (data: InvoicePayload) => {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  reverseInvoice: async (id: string) => {
    const response = await api.post(`/invoices/${id}/reverse`);
    return response.data;
  },
};
