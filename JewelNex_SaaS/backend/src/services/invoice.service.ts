import prisma from '../config/database';
import { InvoiceType, InvoiceStatus, PaymentMode } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AccountingService } from './accounting.service';

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

export class InvoiceService {
  /**
   * Generates a sequential, location/financial-year aware invoice number.
   * Format: FY26-HQ-0001
   */
  static async generateInvoiceNumber(type: InvoiceType): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = type === 'SALE' ? `S${year}` : type === 'PURCHASE' ? `P${year}` : `E${year}`;
    const seqType = `${type}_INVOICE_FY${year}`;

    const lastNumber = await prisma.$transaction(async (tx) => {
      // 1. Lock sequence row for update if it exists
      const seqRecords = await tx.$queryRaw<any[]>`
        SELECT id, lastNumber FROM sequences WHERE type = ${seqType} FOR UPDATE
      `;

      if (seqRecords && seqRecords.length > 0) {
        const seq = seqRecords[0];
        const nextNum = Number(seq.lastNumber) + 1;
        await tx.$executeRaw`
          UPDATE sequences SET lastNumber = ${nextNum}, updatedAt = NOW(3) WHERE id = ${seq.id}
        `;
        return nextNum;
      } else {
        // 2. Row doesn't exist, insert first value. 
        // Handle concurrent insert attempts safely
        try {
          const id = uuidv4();
          await tx.$executeRaw`
            INSERT INTO sequences (id, type, prefix, lastNumber, updatedAt)
            VALUES (${id}, ${seqType}, ${prefix}, 1, NOW(3))
          `;
          return 1;
        } catch (insertErr: any) {
          // If insert failed due to duplicate key, select it with lock and increment
          const retryRecords = await tx.$queryRaw<any[]>`
            SELECT id, lastNumber FROM sequences WHERE type = ${seqType} FOR UPDATE
          `;
          if (retryRecords && retryRecords.length > 0) {
            const retrySeq = retryRecords[0];
            const nextNum = Number(retrySeq.lastNumber) + 1;
            await tx.$executeRaw`
              UPDATE sequences SET lastNumber = ${nextNum}, updatedAt = NOW(3) WHERE id = ${retrySeq.id}
            `;
            return nextNum;
          }
          throw insertErr;
        }
      }
    });

    const nextNum = lastNumber.toString().padStart(4, '0');
    return `${prefix}-${nextNum}`;
  }

  /**
   * Posts an invoice ATOMICALLY. Uses JSON and Stored Procedure for absolute integrity.
   */
  static async postInvoice(dto: CreateInvoiceDTO, userId: string) {
    const invoiceId = uuidv4();
    const invoiceNumber = await this.generateInvoiceNumber(dto.type);

    // Pre-process items to ensure valid JSON structure for SP
    const itemsJson = dto.items.map(item => ({
      id: uuidv4(),
      ...item,
      lotId: item.lotId || null,
      hsn: item.hsn || null,
    }));

    const paymentsJson = dto.payments?.length ? dto.payments : null;

    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Execute Atomic Stored Procedure
        await tx.$executeRaw`
          CALL sp_PostInvoice(
            ${invoiceId},
            ${invoiceNumber},
            ${dto.type},
            ${dto.customerId},
            ${dto.subTotal},
            ${dto.taxTotal},
            ${dto.discount},
            ${dto.grandTotal},
            ${dto.notes || null},
            ${userId},
            ${JSON.stringify(itemsJson)},
            ${paymentsJson ? JSON.stringify(paymentsJson) : null}
          )
        `;

        // 2. Generate double-entry vouchers
        await AccountingService.generateInvoiceVoucher(invoiceId, tx);

        // 3. Fetch the created invoice to return
        return await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { items: true, payments: true, customer: true }
        });
      }, { maxWait: 15000, timeout: 30000 });
    } catch (error: any) {
      if (error.code === 'P2010' || error.message.includes('45000')) {
        throw new Error(error.meta?.message || error.message || 'Invoice posting failed due to inventory or idempotency checks.');
      }
      throw error;
    }
  }

  /**
   * Safely reverses an invoice using Compensating Transactions.
   */
  static async reverseInvoice(invoiceId: string, userId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Execute Stored Procedure
        await tx.$executeRaw`CALL sp_ReverseInvoice(${invoiceId}, ${userId})`;

        // 2. Generate compensating reversal vouchers
        await AccountingService.generateReversalVoucher(invoiceId, tx);

        return { success: true, message: 'Invoice reversed successfully.' };
      }, { maxWait: 15000, timeout: 30000 });
    } catch (error: any) {
      throw new Error(error.meta?.message || error.message || 'Invoice reversal failed.');
    }
  }

  /**
   * Saves a new invoice as a DRAFT. No stock locking or deductions occur.
   */
  static async saveDraft(dto: CreateInvoiceDTO, userId: string) {
    const invoiceId = uuidv4();
    const invoiceNumber = await this.generateInvoiceNumber(dto.type);

    const invoice = await prisma.invoice.create({
      data: {
        id: invoiceId,
        invoiceNumber,
        type: dto.type,
        status: 'DRAFT',
        customerId: dto.customerId,
        subTotal: dto.subTotal,
        taxTotal: dto.taxTotal,
        discount: dto.discount,
        grandTotal: dto.grandTotal,
        notes: dto.notes || null,
        createdById: userId,
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            lotId: item.lotId || null,
            quantity: item.quantity,
            weight: item.weight,
            rate: item.rate,
            purity: item.purity,
            makingCharge: item.makingCharge,
            wastage: item.wastage,
            hsn: item.hsn || null,
            discountPercent: item.discountPercent,
            gstPercent: item.gstPercent,
            amount: item.amount,
          }))
        }
      },
      include: { items: true, payments: true, customer: true }
    });

    return invoice;
  }

  /**
   * Edits an existing DRAFT invoice.
   */
  static async editDraft(id: string, dto: CreateInvoiceDTO, userId: string) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!existing) {
      throw new Error('Invoice not found');
    }

    if (existing.status !== 'DRAFT') {
      throw new Error('Only DRAFT invoices can be edited');
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      return await tx.invoice.update({
        where: { id },
        data: {
          type: dto.type,
          customerId: dto.customerId,
          subTotal: dto.subTotal,
          taxTotal: dto.taxTotal,
          discount: dto.discount,
          grandTotal: dto.grandTotal,
          notes: dto.notes || null,
          items: {
            create: dto.items.map(item => ({
              productId: item.productId,
              lotId: item.lotId || null,
              quantity: item.quantity,
              weight: item.weight,
              rate: item.rate,
              purity: item.purity,
              makingCharge: item.makingCharge,
              wastage: item.wastage,
              hsn: item.hsn || null,
              discountPercent: item.discountPercent,
              gstPercent: item.gstPercent,
              amount: item.amount,
            }))
          }
        },
        include: { items: true, payments: true, customer: true }
      });
    });

    return updated;
  }

  /**
   * Posts an existing DRAFT invoice, making it POSTED, locking stock, creating movements.
   */
  static async postDraft(id: string, userId: string, payments: Array<{ amount: number; mode: PaymentMode; referenceId?: string }> = []) {
    try {
      const paymentsJson = payments.length ? payments : null;

      return await prisma.$transaction(async (tx) => {
        // 1. Execute Stored Procedure
        await tx.$executeRaw`
          CALL sp_PostDraftInvoice(
            ${id},
            ${userId},
            ${paymentsJson ? JSON.stringify(paymentsJson) : null}
          )
        `;

        // 2. Generate double-entry vouchers
        await AccountingService.generateInvoiceVoucher(id, tx);

        // 3. Fetch the created invoice to return
        return await tx.invoice.findUnique({
          where: { id },
          include: { items: true, payments: true, customer: true }
        });
      }, { maxWait: 15000, timeout: 30000 });
    } catch (error: any) {
      if (error.code === 'P2010' || error.message.includes('45000')) {
        throw new Error(error.meta?.message || error.message || 'Draft posting failed due to inventory or status checks.');
      }
      throw error;
    }
  }

  /**
   * Lists all draft invoices.
   */
  static async listDrafts() {
    return await prisma.invoice.findMany({
      where: { status: 'DRAFT' },
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
