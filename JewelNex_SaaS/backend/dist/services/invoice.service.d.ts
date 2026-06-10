import { InvoiceType, PaymentMode } from '@prisma/client';
export interface CreateInvoiceDTO {
    type: InvoiceType;
    customerId: string;
    notes?: string;
    items: Array<{
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
    }>;
    payments?: Array<{
        amount: number;
        mode: PaymentMode;
        referenceId?: string;
    }>;
    subTotal: number;
    taxTotal: number;
    discount: number;
    grandTotal: number;
}
export declare class InvoiceService {
    /**
     * Generates a sequential, location/financial-year aware invoice number.
     * Format: FY26-HQ-0001
     */
    static generateInvoiceNumber(type: InvoiceType): Promise<string>;
    /**
     * Posts an invoice ATOMICALLY. Uses JSON and Stored Procedure for absolute integrity.
     */
    static postInvoice(dto: CreateInvoiceDTO, userId: string): Promise<({
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            gstNumber: string | null;
            address: string | null;
            panNumber: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        items: {
            id: string;
            invoiceId: string;
            productId: string;
            lotId: string | null;
            quantity: number;
            weight: import("@prisma/client/runtime/library").Decimal;
            rate: import("@prisma/client/runtime/library").Decimal;
            purity: import("@prisma/client/runtime/library").Decimal;
            makingCharge: import("@prisma/client/runtime/library").Decimal;
            wastage: import("@prisma/client/runtime/library").Decimal;
            hsn: string | null;
            discountPercent: import("@prisma/client/runtime/library").Decimal;
            gstPercent: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
        payments: {
            id: string;
            invoiceId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            mode: import(".prisma/client").$Enums.PaymentMode;
            referenceId: string | null;
            status: string;
            processedById: string;
            createdAt: Date;
        }[];
    } & {
        id: string;
        invoiceNumber: string;
        type: import(".prisma/client").$Enums.InvoiceType;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        customerId: string;
        subTotal: import("@prisma/client/runtime/library").Decimal;
        taxTotal: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        transactionId: string | null;
        notes: string | null;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    /**
     * Safely reverses an invoice using Compensating Transactions.
     */
    static reverseInvoice(invoiceId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Saves a new invoice as a DRAFT. No stock locking or deductions occur.
     */
    static saveDraft(dto: CreateInvoiceDTO, userId: string): Promise<{
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            gstNumber: string | null;
            address: string | null;
            panNumber: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        items: {
            id: string;
            invoiceId: string;
            productId: string;
            lotId: string | null;
            quantity: number;
            weight: import("@prisma/client/runtime/library").Decimal;
            rate: import("@prisma/client/runtime/library").Decimal;
            purity: import("@prisma/client/runtime/library").Decimal;
            makingCharge: import("@prisma/client/runtime/library").Decimal;
            wastage: import("@prisma/client/runtime/library").Decimal;
            hsn: string | null;
            discountPercent: import("@prisma/client/runtime/library").Decimal;
            gstPercent: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
        payments: {
            id: string;
            invoiceId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            mode: import(".prisma/client").$Enums.PaymentMode;
            referenceId: string | null;
            status: string;
            processedById: string;
            createdAt: Date;
        }[];
    } & {
        id: string;
        invoiceNumber: string;
        type: import(".prisma/client").$Enums.InvoiceType;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        customerId: string;
        subTotal: import("@prisma/client/runtime/library").Decimal;
        taxTotal: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        transactionId: string | null;
        notes: string | null;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Edits an existing DRAFT invoice.
     */
    static editDraft(id: string, dto: CreateInvoiceDTO, userId: string): Promise<{
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            gstNumber: string | null;
            address: string | null;
            panNumber: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        items: {
            id: string;
            invoiceId: string;
            productId: string;
            lotId: string | null;
            quantity: number;
            weight: import("@prisma/client/runtime/library").Decimal;
            rate: import("@prisma/client/runtime/library").Decimal;
            purity: import("@prisma/client/runtime/library").Decimal;
            makingCharge: import("@prisma/client/runtime/library").Decimal;
            wastage: import("@prisma/client/runtime/library").Decimal;
            hsn: string | null;
            discountPercent: import("@prisma/client/runtime/library").Decimal;
            gstPercent: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
        payments: {
            id: string;
            invoiceId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            mode: import(".prisma/client").$Enums.PaymentMode;
            referenceId: string | null;
            status: string;
            processedById: string;
            createdAt: Date;
        }[];
    } & {
        id: string;
        invoiceNumber: string;
        type: import(".prisma/client").$Enums.InvoiceType;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        customerId: string;
        subTotal: import("@prisma/client/runtime/library").Decimal;
        taxTotal: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        transactionId: string | null;
        notes: string | null;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Posts an existing DRAFT invoice, making it POSTED, locking stock, creating movements.
     */
    static postDraft(id: string, userId: string, payments?: Array<{
        amount: number;
        mode: PaymentMode;
        referenceId?: string;
    }>): Promise<({
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            gstNumber: string | null;
            address: string | null;
            panNumber: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        items: {
            id: string;
            invoiceId: string;
            productId: string;
            lotId: string | null;
            quantity: number;
            weight: import("@prisma/client/runtime/library").Decimal;
            rate: import("@prisma/client/runtime/library").Decimal;
            purity: import("@prisma/client/runtime/library").Decimal;
            makingCharge: import("@prisma/client/runtime/library").Decimal;
            wastage: import("@prisma/client/runtime/library").Decimal;
            hsn: string | null;
            discountPercent: import("@prisma/client/runtime/library").Decimal;
            gstPercent: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
        payments: {
            id: string;
            invoiceId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            mode: import(".prisma/client").$Enums.PaymentMode;
            referenceId: string | null;
            status: string;
            processedById: string;
            createdAt: Date;
        }[];
    } & {
        id: string;
        invoiceNumber: string;
        type: import(".prisma/client").$Enums.InvoiceType;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        customerId: string;
        subTotal: import("@prisma/client/runtime/library").Decimal;
        taxTotal: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        transactionId: string | null;
        notes: string | null;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    /**
     * Lists all draft invoices.
     */
    static listDrafts(): Promise<({
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            gstNumber: string | null;
            address: string | null;
            panNumber: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        items: {
            id: string;
            invoiceId: string;
            productId: string;
            lotId: string | null;
            quantity: number;
            weight: import("@prisma/client/runtime/library").Decimal;
            rate: import("@prisma/client/runtime/library").Decimal;
            purity: import("@prisma/client/runtime/library").Decimal;
            makingCharge: import("@prisma/client/runtime/library").Decimal;
            wastage: import("@prisma/client/runtime/library").Decimal;
            hsn: string | null;
            discountPercent: import("@prisma/client/runtime/library").Decimal;
            gstPercent: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        invoiceNumber: string;
        type: import(".prisma/client").$Enums.InvoiceType;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        customerId: string;
        subTotal: import("@prisma/client/runtime/library").Decimal;
        taxTotal: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        transactionId: string | null;
        notes: string | null;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
//# sourceMappingURL=invoice.service.d.ts.map