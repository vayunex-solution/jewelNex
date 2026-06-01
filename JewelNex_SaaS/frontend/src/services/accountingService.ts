import api from '../lib/api';

export interface AccountGroup {
  id: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentGroupId?: string | null;
}

export interface AccountHead {
  id: string;
  name: string;
  groupId: string;
  customerId?: string | null;
  openingBal: number;
  balanceType: 'DR' | 'CR';
  group: AccountGroup;
}

export interface VoucherEntry {
  id: string;
  voucherId: string;
  accountId: string;
  amount: number;
  type: 'DR' | 'CR';
  createdAt: string;
  account?: {
    name: string;
    balanceType: 'DR' | 'CR';
  };
  voucher?: {
    voucherNumber: string;
    type: string;
    date: string;
    reference?: string | null;
    narration?: string | null;
  };
  runningBalance?: number;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: 'JOURNAL' | 'SALES' | 'PURCHASE' | 'PAYMENT' | 'RECEIPT' | 'CONTRA';
  date: string;
  reference?: string | null;
  narration?: string | null;
  createdAt: string;
  entries: VoucherEntry[];
}

export interface TrialBalanceRow {
  headId: string;
  headName: string;
  groupName: string;
  groupType: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceReport {
  date: string;
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
}

export interface ProfitLossReport {
  startDate: string | null;
  endDate: string | null;
  salesRevenue: number;
  cogs: number;
  grossProfit: number;
  discountAllowed: number;
  discountReceived: number;
  netProfit: number;
}

export interface BalanceSheetItem {
  headId: string;
  name: string;
  balance: number;
}

export interface BalanceSheetReport {
  date: string;
  assets: {
    list: BalanceSheetItem[];
    total: number;
  };
  liabilities: {
    list: BalanceSheetItem[];
    total: number;
  };
  equity: {
    list: BalanceSheetItem[];
    total: number;
    retainedEarnings: number;
  };
  totalEquityAndLiabilities: number;
  balanced: boolean;
}

export const accountingService = {
  getHeads: async () => {
    const response = await api.get('/accounting/heads');
    return response.data;
  },

  getDayBook: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/accounting/reports/daybook', { params });
    return response.data;
  },

  getLedger: async (accountId: string, startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(`/accounting/reports/ledger/${accountId}`, { params });
    return response.data;
  },

  getCashBook: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/accounting/reports/cashbook', { params });
    return response.data;
  },

  getBankBook: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/accounting/reports/bankbook', { params });
    return response.data;
  },

  getTrialBalance: async (date?: string) => {
    const params: any = {};
    if (date) params.date = date;
    const response = await api.get('/accounting/reports/trial-balance', { params });
    return response.data;
  },

  getProfitLoss: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/accounting/reports/profit-loss', { params });
    return response.data;
  },

  getBalanceSheet: async (date?: string) => {
    const params: any = {};
    if (date) params.date = date;
    const response = await api.get('/accounting/reports/balance-sheet', { params });
    return response.data;
  },

  initializeCOA: async () => {
    const response = await api.post('/accounting/initialize');
    return response.data;
  }
};
