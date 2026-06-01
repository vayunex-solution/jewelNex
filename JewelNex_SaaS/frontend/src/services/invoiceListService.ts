import api from '../lib/api';

export interface PostedInvoice {
  id: string;
  invoiceNumber: string;
  type: 'SALE' | 'PURCHASE' | 'ESTIMATE';
  status: string;
  grandTotal: number | string;
  subTotal: number | string;
  taxTotal: number | string;
  discount: number | string;
  createdAt: string;
  customer: { id: string; name: string; phone?: string; email?: string };
  payments: { mode: string; amount: number | string; referenceId?: string }[];
}

export interface InvoiceListResponse {
  data: PostedInvoice[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export const invoiceListService = {
  listPosted: async (params?: {
    type?: string; start?: string; end?: string; page?: number; limit?: number;
  }): Promise<InvoiceListResponse> => {
    const res = await api.get('/invoices', { params });
    return res.data;
  },

  getById: async (id: string): Promise<PostedInvoice> => {
    const res = await api.get(`/invoices/${id}`);
    return res.data.data;
  },

  downloadPDF: (id: string) => {
    // Open PDF in new tab — browser will render inline or prompt download
    const token = localStorage.getItem('token');
    const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '');
    window.open(`${baseUrl}/invoices/${id}/pdf?token=${token}`, '_blank');
  },

  downloadExcel: (type: 'trial-balance' | 'daybook', params?: Record<string, string>) => {
    const token = localStorage.getItem('token');
    const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '');
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    window.open(`${baseUrl}/export/${type}.xlsx${qs}&token=${token}`, '_blank');
  },

  downloadCSV: (params?: { start?: string; end?: string }) => {
    const token = localStorage.getItem('token');
    const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '');
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    window.open(`${baseUrl}/export/invoices.csv${qs}&token=${token}`, '_blank');
  },
};
