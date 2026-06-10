import { VoucherType, EntryType } from '@prisma/client';
export interface VoucherEntryDTO {
    accountId: string;
    amount: number;
    type: EntryType;
}
export interface VoucherDTO {
    type: VoucherType;
    date?: Date;
    reference?: string;
    narration?: string;
    entries: VoucherEntryDTO[];
}
export declare class AccountingService {
    /**
     * Initializes standard Chart of Accounts (COA) groups and heads.
     */
    static initializeChartOfAccounts(): Promise<void>;
    /**
     * Generates a unique, transaction-safe voucher number.
     */
    static generateVoucherNumber(type: VoucherType, tx: any): Promise<string>;
    /**
     * Creates a journal Voucher atomically. Enforces double-entry balance check.
     */
    static createVoucher(dto: VoucherDTO, txContext?: any): Promise<any>;
    /**
     * Helper to fetch or create a customer's personal AccountHead.
     */
    static getOrCreateCustomerHead(customerId: string, customerName: string, tx: any): Promise<any>;
    /**
     * Automatically generates Vouchers for posted invoices.
     */
    static generateInvoiceVoucher(invoiceId: string, tx: any): Promise<void>;
    /**
     * Automatically generates compensating reversal Vouchers.
     */
    static generateReversalVoucher(invoiceId: string, tx: any): Promise<void>;
    /**
     * Calculates dynamic ledger balance for a given AccountHead.
     */
    static getAccountBalance(accountId: string, txContext?: any): Promise<number>;
    /**
     * Calculates customer dynamic balance.
     */
    static getCustomerBalance(customerId: string, txContext?: any): Promise<number>;
    /**
     * Retrieves the Day Book showing chronological vouchers and entries.
     */
    static getDayBook(startDate?: Date, endDate?: Date, txContext?: any): Promise<any>;
    /**
     * Retrieves the General Ledger for an account head including opening and closing balances.
     */
    static getGeneralLedger(accountId: string, startDate?: Date, endDate?: Date, txContext?: any): Promise<{
        head: any;
        openingBalance: number;
        entries: any;
        closingBalance: number;
    }>;
    /**
     * Retrieves the Trial Balance showing net balances grouped by AccountGroup.
     */
    static getTrialBalance(date?: Date, txContext?: any): Promise<{
        date: Date;
        rows: {
            headId: any;
            headName: any;
            groupName: any;
            groupType: any;
            debit: number;
            credit: number;
            balance: number;
        }[];
        totalDebit: number;
        totalCredit: number;
        balanced: boolean;
    }>;
    /**
     * Calculates the Weighted Average Cost of a product.
     */
    static getProductWeightedAverageCost(productId: string, txContext?: any): Promise<number>;
    /**
     * Generates the Profit & Loss statement.
     */
    static getProfitLoss(startDate?: Date, endDate?: Date, txContext?: any): Promise<{
        startDate: Date | null;
        endDate: Date | null;
        salesRevenue: number;
        cogs: number;
        grossProfit: number;
        discountAllowed: number;
        discountReceived: number;
        netProfit: number;
    }>;
    /**
     * Generates the Balance Sheet statement.
     */
    static getBalanceSheet(date?: Date, txContext?: any): Promise<{
        date: Date;
        assets: {
            list: {
                headId: any;
                name: any;
                balance: number;
            }[];
            total: number;
        };
        liabilities: {
            list: {
                headId: any;
                name: any;
                balance: number;
            }[];
            total: number;
        };
        equity: {
            list: {
                headId: any;
                name: any;
                balance: number;
            }[];
            total: number;
            retainedEarnings: number;
        };
        totalEquityAndLiabilities: number;
        balanced: boolean;
    }>;
}
//# sourceMappingURL=accounting.service.d.ts.map