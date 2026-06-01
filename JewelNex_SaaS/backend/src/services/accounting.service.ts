import prisma from '../config/database';
import { VoucherType, EntryType, PaymentMode, InvoiceType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

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

export class AccountingService {
  /**
   * Initializes standard Chart of Accounts (COA) groups and heads.
   */
  static async initializeChartOfAccounts() {
    console.log('Initializing Chart of Accounts...');
    
    return await prisma.$transaction(async (tx) => {
      // 1. Seed Groups
      const groupsSeed = [
        { name: 'Assets', type: 'ASSET', parentName: null },
        { name: 'Liabilities', type: 'LIABILITY', parentName: null },
        { name: 'Equity', type: 'EQUITY', parentName: null },
        { name: 'Revenue', type: 'REVENUE', parentName: null },
        { name: 'Expenses', type: 'EXPENSE', parentName: null },
        
        // Sub-Groups
        { name: 'Sundry Debtors', type: 'ASSET', parentName: 'Assets' },
        { name: 'Cash on Hand', type: 'ASSET', parentName: 'Assets' },
        { name: 'Bank Accounts', type: 'ASSET', parentName: 'Assets' },
        { name: 'Current Assets', type: 'ASSET', parentName: 'Assets' },
        { name: 'Sundry Creditors', type: 'LIABILITY', parentName: 'Liabilities' },
        { name: 'Duties & Taxes', type: 'LIABILITY', parentName: 'Liabilities' },
        { name: 'Capital Account', type: 'EQUITY', parentName: 'Equity' },
        { name: 'Sales Accounts', type: 'REVENUE', parentName: 'Revenue' },
        { name: 'Purchase Accounts', type: 'EXPENSE', parentName: 'Expenses' },
        { name: 'Direct Expenses', type: 'EXPENSE', parentName: 'Expenses' },
      ];

      const groupMap = new Map<string, string>();

      for (const group of groupsSeed) {
        let parentGroupId = null;
        if (group.parentName) {
          parentGroupId = groupMap.get(group.parentName) || null;
        }

        let dbGroup = await tx.accountGroup.findUnique({
          where: { name: group.name }
        });

        if (!dbGroup) {
          dbGroup = await tx.accountGroup.create({
            data: {
              name: group.name,
              type: group.type,
              parentGroupId: parentGroupId
            }
          });
        }
        groupMap.set(group.name, dbGroup.id);
      }

      // 2. Seed Heads
      const headsSeed = [
        { name: 'Cash Account', groupName: 'Cash on Hand', balanceType: 'DR', openingBal: 0 },
        { name: 'HDFC Bank', groupName: 'Bank Accounts', balanceType: 'DR', openingBal: 0 },
        { name: 'General Sales', groupName: 'Sales Accounts', balanceType: 'CR', openingBal: 0 },
        { name: 'General Purchases', groupName: 'Purchase Accounts', balanceType: 'DR', openingBal: 0 },
        { name: 'GST Payable', groupName: 'Duties & Taxes', balanceType: 'CR', openingBal: 0 },
        { name: 'Discount Allowed', groupName: 'Direct Expenses', balanceType: 'DR', openingBal: 0 },
        { name: 'Discount Received', groupName: 'Revenue', balanceType: 'CR', openingBal: 0 },
        { name: 'Inventory Account', groupName: 'Current Assets', balanceType: 'DR', openingBal: 0 },
      ];

      for (const head of headsSeed) {
        const groupId = groupMap.get(head.groupName);
        if (!groupId) throw new Error(`Group not found: ${head.groupName}`);

        const existingHead = await tx.accountHead.findFirst({
          where: { name: head.name }
        });

        if (!existingHead) {
          await tx.accountHead.create({
            data: {
              name: head.name,
              groupId: groupId,
              balanceType: head.balanceType,
              openingBal: head.openingBal
            }
          });
        } else if (existingHead.groupId !== groupId) {
          await tx.accountHead.update({
            where: { id: existingHead.id },
            data: { groupId: groupId }
          });
        }
      }
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Generates a unique, transaction-safe voucher number.
   */
  static async generateVoucherNumber(type: VoucherType, tx: any): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `V-${type.slice(0, 3)}-FY${year}`;
    const seqType = `VOUCHER_${type}_FY${year}`;

    const seqRecords = await tx.$queryRaw<any[]>`
      SELECT id, lastNumber FROM sequences WHERE type = ${seqType} FOR UPDATE
    `;

    let nextNum = 1;
    if (seqRecords && seqRecords.length > 0) {
      const seq = seqRecords[0];
      nextNum = Number(seq.lastNumber) + 1;
      await tx.$executeRaw`
        UPDATE sequences SET lastNumber = ${nextNum}, updatedAt = NOW(3) WHERE id = ${seq.id}
      `;
    } else {
      try {
        const id = uuidv4();
        await tx.$executeRaw`
          INSERT INTO sequences (id, type, prefix, lastNumber, updatedAt)
          VALUES (${id}, ${seqType}, ${prefix}, 1, NOW(3))
        `;
        nextNum = 1;
      } catch (e) {
        const retryRecords = await tx.$queryRaw<any[]>`
          SELECT id, lastNumber FROM sequences WHERE type = ${seqType} FOR UPDATE
        `;
        if (retryRecords && retryRecords.length > 0) {
          const retrySeq = retryRecords[0];
          nextNum = Number(retrySeq.lastNumber) + 1;
          await tx.$executeRaw`
            UPDATE sequences SET lastNumber = ${nextNum}, updatedAt = NOW(3) WHERE id = ${retrySeq.id}
          `;
        }
      }
    }

    return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
  }

  /**
   * Creates a journal Voucher atomically. Enforces double-entry balance check.
   */
  static async createVoucher(dto: VoucherDTO, txContext?: any) {
    const client = txContext || prisma;

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of dto.entries) {
      const amount = Number(entry.amount);
      if (amount <= 0) {
        throw new Error('Voucher entry amount must be positive.');
      }
      if (entry.type === 'DR') {
        totalDebit += amount;
      } else {
        totalCredit += amount;
      }
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Voucher double-entry out of balance. Debits: ₹${totalDebit.toFixed(2)}, Credits: ₹${totalCredit.toFixed(2)}`);
    }

    const runInTx = async (tx: any) => {
      const voucherNumber = await this.generateVoucherNumber(dto.type, tx);
      const voucherId = uuidv4();

      return await tx.voucher.create({
        data: {
          id: voucherId,
          voucherNumber,
          type: dto.type,
          date: dto.date || new Date(),
          reference: dto.reference || null,
          narration: dto.narration || null,
          entries: {
            create: dto.entries.map((entry) => ({
              id: uuidv4(),
              accountId: entry.accountId,
              amount: entry.amount,
              type: entry.type,
            })),
          },
        },
        include: { entries: true },
      });
    };

    if (txContext) {
      return await runInTx(txContext);
    } else {
      return await prisma.$transaction(async (tx) => {
        return await runInTx(tx);
      }, { maxWait: 15000, timeout: 30000 });
    }
  }

  /**
   * Helper to fetch or create a customer's personal AccountHead.
   */
  static async getOrCreateCustomerHead(customerId: string, customerName: string, tx: any) {
    let head = await tx.accountHead.findUnique({
      where: { customerId }
    });

    if (!head) {
      let group = await tx.accountGroup.findUnique({
        where: { name: 'Sundry Debtors' }
      });

      if (!group) {
        group = await tx.accountGroup.create({
          data: { name: 'Sundry Debtors', type: 'ASSET' }
        });
      }

      head = await tx.accountHead.create({
        data: {
          name: `${customerName} (Customer)`,
          groupId: group.id,
          customerId: customerId,
          balanceType: 'DR',
          openingBal: 0
        }
      });
    }

    return head;
  }

  /**
   * Automatically generates Vouchers for posted invoices.
   */
  static async generateInvoiceVoucher(invoiceId: string, tx: any) {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, payments: true }
    });

    if (!invoice) throw new Error('Invoice not found for voucher posting.');

    const subTotal = Number(invoice.subTotal);
    const taxTotal = Number(invoice.taxTotal);
    const discount = Number(invoice.discount);
    const grandTotal = Number(invoice.grandTotal);

    // 1. Fetch system account heads
    const cashHead = await tx.accountHead.findFirst({ where: { name: 'Cash Account' } });
    const bankHead = await tx.accountHead.findFirst({ where: { name: 'HDFC Bank' } });
    const salesHead = await tx.accountHead.findFirst({ where: { name: 'General Sales' } });
    const purchaseHead = await tx.accountHead.findFirst({ where: { name: 'General Purchases' } });
    const gstHead = await tx.accountHead.findFirst({ where: { name: 'GST Payable' } });
    const discAllowedHead = await tx.accountHead.findFirst({ where: { name: 'Discount Allowed' } });
    const discReceivedHead = await tx.accountHead.findFirst({ where: { name: 'Discount Received' } });

    if (!salesHead || !purchaseHead || !gstHead || !discAllowedHead || !discReceivedHead || !cashHead || !bankHead) {
      throw new Error('Chart of Accounts is not properly initialized. Run initialization first.');
    }

    const customerHead = await this.getOrCreateCustomerHead(invoice.customerId, invoice.customer.name, tx);

    if (invoice.type === 'SALE') {
      // Debit Customer (Receivable) & Discount Allowed, Credit Sales & GST
      const entries: VoucherEntryDTO[] = [
        { accountId: customerHead.id, amount: grandTotal, type: 'DR' },
      ];

      if (discount > 0) {
        entries.push({ accountId: discAllowedHead.id, amount: discount, type: 'DR' });
      }

      entries.push({ accountId: salesHead.id, amount: subTotal, type: 'CR' });

      if (taxTotal > 0) {
        entries.push({ accountId: gstHead.id, amount: taxTotal, type: 'CR' });
      }

      await this.createVoucher({
        type: 'SALES',
        reference: invoice.id,
        narration: `Sales Invoice ${invoice.invoiceNumber} posted.`,
        entries
      }, tx);

      // Create Receipt Voucher for payments
      if (invoice.payments && invoice.payments.length > 0) {
        for (const payment of invoice.payments) {
          const payAmount = Number(payment.amount);
          if (payAmount <= 0) continue;

          const debitAccountId = payment.mode === 'CASH' ? cashHead.id : bankHead.id;

          await this.createVoucher({
            type: 'RECEIPT',
            reference: invoice.id,
            narration: `Payment received via ${payment.mode} against Invoice ${invoice.invoiceNumber}. Ref: ${payment.referenceId || 'N/A'}`,
            entries: [
              { accountId: debitAccountId, amount: payAmount, type: 'DR' },
              { accountId: customerHead.id, amount: payAmount, type: 'CR' }
            ]
          }, tx);
        }
      }

    } else if (invoice.type === 'PURCHASE') {
      // Debit Purchase & GST, Credit Customer & Discount Received
      const entries: VoucherEntryDTO[] = [
        { accountId: purchaseHead.id, amount: subTotal, type: 'DR' },
      ];

      if (taxTotal > 0) {
        entries.push({ accountId: gstHead.id, amount: taxTotal, type: 'DR' }); // Representing purchase tax offset/liability adjustment
      }

      entries.push({ accountId: customerHead.id, amount: grandTotal, type: 'CR' });

      if (discount > 0) {
        entries.push({ accountId: discReceivedHead.id, amount: discount, type: 'CR' });
      }

      await this.createVoucher({
        type: 'PURCHASE',
        reference: invoice.id,
        narration: `Purchase Invoice ${invoice.invoiceNumber} posted.`,
        entries
      }, tx);

      // Create Payment Voucher for payments
      if (invoice.payments && invoice.payments.length > 0) {
        for (const payment of invoice.payments) {
          const payAmount = Number(payment.amount);
          if (payAmount <= 0) continue;

          const creditAccountId = payment.mode === 'CASH' ? cashHead.id : bankHead.id;

          await this.createVoucher({
            type: 'PAYMENT',
            reference: invoice.id,
            narration: `Payment made via ${payment.mode} against Purchase Invoice ${invoice.invoiceNumber}. Ref: ${payment.referenceId || 'N/A'}`,
            entries: [
              { accountId: customerHead.id, amount: payAmount, type: 'DR' },
              { accountId: creditAccountId, amount: payAmount, type: 'CR' }
            ]
          }, tx);
        }
      }
    }
  }

  /**
   * Automatically generates compensating reversal Vouchers.
   */
  static async generateReversalVoucher(invoiceId: string, tx: any) {
    const originalVouchers = await tx.voucher.findMany({
      where: { reference: invoiceId },
      include: { entries: true }
    });

    for (const voucher of originalVouchers) {
      const reversedEntries: VoucherEntryDTO[] = voucher.entries.map((entry: any) => ({
        accountId: entry.accountId,
        amount: Number(entry.amount),
        type: entry.type === 'DR' ? 'CR' : 'DR' // Swap Debits and Credits
      }));

      await this.createVoucher({
        type: 'JOURNAL',
        reference: invoiceId,
        narration: `Reversal of Voucher ${voucher.voucherNumber} (Invoice reversal compensation).`,
        entries: reversedEntries
      }, tx);
    }
  }

  /**
   * Calculates dynamic ledger balance for a given AccountHead.
   */
  static async getAccountBalance(accountId: string, txContext?: any) {
    const client = txContext || prisma;

    const head = await client.accountHead.findUnique({
      where: { id: accountId }
    });

    if (!head) throw new Error('Account head not found.');

    const entries = await client.voucherEntry.findMany({
      where: { accountId }
    });

    let balance = Number(head.openingBal);

    for (const entry of entries) {
      const amount = Number(entry.amount);
      if (head.balanceType === 'DR') {
        // DR normal balance (Assets, Expenses)
        balance += entry.type === 'DR' ? amount : -amount;
      } else {
        // CR normal balance (Liabilities, Equity, Revenue)
        balance += entry.type === 'CR' ? amount : -amount;
      }
    }

    return balance;
  }

  /**
   * Calculates customer dynamic balance.
   */
  static async getCustomerBalance(customerId: string, txContext?: any) {
    const client = txContext || prisma;

    const head = await client.accountHead.findUnique({
      where: { customerId }
    });

    if (!head) return 0;

    return await this.getAccountBalance(head.id, client);
  }

  /**
   * Retrieves the Day Book showing chronological vouchers and entries.
   */
  static async getDayBook(startDate?: Date, endDate?: Date, txContext?: any) {
    const client = txContext || prisma;
    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    return await client.voucher.findMany({
      where: whereClause,
      include: {
        entries: {
          include: {
            account: {
              select: { name: true, balanceType: true }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    });
  }

  /**
   * Retrieves the General Ledger for an account head including opening and closing balances.
   */
  static async getGeneralLedger(accountId: string, startDate?: Date, endDate?: Date, txContext?: any) {
    const client = txContext || prisma;

    const head = await client.accountHead.findUnique({
      where: { id: accountId },
      include: { group: true }
    });

    if (!head) throw new Error('Account head not found.');

    // 1. Calculate opening balance (all entries before startDate + head.openingBal)
    let openingBalance = Number(head.openingBal);
    if (startDate) {
      const preEntries = await client.voucherEntry.findMany({
        where: {
          accountId,
          voucher: { date: { lt: new Date(startDate) } }
        }
      });
      for (const entry of preEntries) {
        const amount = Number(entry.amount);
        if (head.balanceType === 'DR') {
          openingBalance += entry.type === 'DR' ? amount : -amount;
        } else {
          openingBalance += entry.type === 'CR' ? amount : -amount;
        }
      }
    }

    // 2. Fetch ledger entries within the date range
    const whereClause: any = { accountId };
    if (startDate || endDate) {
      whereClause.voucher = {};
      if (startDate) whereClause.voucher.date = { gte: new Date(startDate) };
      if (endDate) {
        whereClause.voucher.date = { ...whereClause.voucher.date, lte: new Date(endDate) };
      }
    }

    const entries = await client.voucherEntry.findMany({
      where: whereClause,
      include: {
        voucher: {
          select: { voucherNumber: true, type: true, date: true, reference: true, narration: true }
        }
      },
      orderBy: { voucher: { date: 'asc' } }
    });

    // 3. Compute running balance
    let runningBalance = openingBalance;
    const ledgerEntries = entries.map((entry: any) => {
      const amount = Number(entry.amount);
      if (head.balanceType === 'DR') {
        runningBalance += entry.type === 'DR' ? amount : -amount;
      } else {
        runningBalance += entry.type === 'CR' ? amount : -amount;
      }
      return {
        id: entry.id,
        voucherId: entry.voucherId,
        accountId: entry.accountId,
        amount,
        type: entry.type,
        createdAt: entry.createdAt,
        voucher: entry.voucher,
        runningBalance
      };
    });

    return {
      head,
      openingBalance,
      entries: ledgerEntries,
      closingBalance: runningBalance
    };
  }

  /**
   * Retrieves the Trial Balance showing net balances grouped by AccountGroup.
   */
  static async getTrialBalance(date?: Date, txContext?: any) {
    const client = txContext || prisma;
    const heads = await client.accountHead.findMany({
      include: { group: true }
    });

    const dateLimit = date ? new Date(date) : undefined;
    const rows = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const head of heads) {
      const entries = await client.voucherEntry.findMany({
        where: {
          accountId: head.id,
          ...(dateLimit ? { voucher: { date: { lte: dateLimit } } } : {})
        }
      });

      let balance = Number(head.openingBal);
      for (const entry of entries) {
        const amount = Number(entry.amount);
        if (head.balanceType === 'DR') {
          balance += entry.type === 'DR' ? amount : -amount;
        } else {
          balance += entry.type === 'CR' ? amount : -amount;
        }
      }

      let debit = 0;
      let credit = 0;

      if (balance !== 0) {
        if (head.balanceType === 'DR') {
          if (balance > 0) debit = balance;
          else credit = Math.abs(balance);
        } else {
          if (balance > 0) credit = balance;
          else debit = Math.abs(balance);
        }
      }

      totalDebit += debit;
      totalCredit += credit;

      rows.push({
        headId: head.id,
        headName: head.name,
        groupName: head.group.name,
        groupType: head.group.type,
        debit,
        credit,
        balance
      });
    }

    return {
      date: dateLimit || new Date(),
      rows,
      totalDebit,
      totalCredit,
      balanced: Math.abs(totalDebit - totalCredit) <= 0.01
    };
  }

  /**
   * Calculates the Weighted Average Cost of a product.
   */
  static async getProductWeightedAverageCost(productId: string, txContext?: any): Promise<number> {
    const client = txContext || prisma;

    const purchaseItems = await client.invoiceItem.findMany({
      where: {
        productId,
        invoice: { type: 'PURCHASE', status: 'POSTED' }
      }
    });

    let totalCost = 0;
    let totalQty = 0;

    for (const item of purchaseItems) {
      totalCost += Number(item.quantity) * Number(item.rate);
      totalQty += Number(item.quantity);
    }

    if (totalQty === 0) {
      // Fallback: Use latest sale item rate or default product cost if purchase record is absent
      const product = await client.product.findUnique({ where: { id: productId } });
      return product ? Number(product.makingCharge) : 0; // fallback to makingCharge as cost mock
    }

    return totalCost / totalQty;
  }

  /**
   * Generates the Profit & Loss statement.
   */
  static async getProfitLoss(startDate?: Date, endDate?: Date, txContext?: any) {
    const client = txContext || prisma;

    const rangeClause: any = {};
    if (startDate) rangeClause.gte = new Date(startDate);
    if (endDate) rangeClause.lte = new Date(endDate);

    const hasRange = startDate || endDate;

    // 1. Calculate Sales Revenue
    const salesGroup = await client.accountGroup.findUnique({ where: { name: 'Sales Accounts' } });
    let salesRevenue = 0;
    if (salesGroup) {
      const salesHeads = await client.accountHead.findMany({ where: { groupId: salesGroup.id } });
      for (const sh of salesHeads) {
        const entries = await client.voucherEntry.findMany({
          where: {
            accountId: sh.id,
            ...(hasRange ? { voucher: { date: rangeClause } } : {})
          }
        });
        for (const e of entries) {
          salesRevenue += e.type === 'CR' ? Number(e.amount) : -Number(e.amount);
        }
      }
    }

    // 2. Calculate Discounts
    const discAllowedHead = await client.accountHead.findFirst({ where: { name: 'Discount Allowed' } });
    let discountAllowed = 0;
    if (discAllowedHead) {
      const entries = await client.voucherEntry.findMany({
        where: {
          accountId: discAllowedHead.id,
          ...(hasRange ? { voucher: { date: rangeClause } } : {})
        }
      });
      for (const e of entries) {
        discountAllowed += e.type === 'DR' ? Number(e.amount) : -Number(e.amount);
      }
    }

    const discReceivedHead = await client.accountHead.findFirst({ where: { name: 'Discount Received' } });
    let discountReceived = 0;
    if (discReceivedHead) {
      const entries = await client.voucherEntry.findMany({
        where: {
          accountId: discReceivedHead.id,
          ...(hasRange ? { voucher: { date: rangeClause } } : {})
        }
      });
      for (const e of entries) {
        discountReceived += e.type === 'CR' ? Number(e.amount) : -Number(e.amount);
      }
    }

    // 3. Dynamic COGS Valuation using Weighted Average Cost
    const saleItems = await client.invoiceItem.findMany({
      where: {
        invoice: {
          type: 'SALE',
          status: 'POSTED',
          ...(hasRange ? { createdAt: rangeClause } : {})
        }
      }
    });

    let cogs = 0;
    for (const item of saleItems) {
      const wac = await this.getProductWeightedAverageCost(item.productId, client);
      cogs += Number(item.quantity) * wac;
    }

    const grossProfit = salesRevenue - cogs;
    const netProfit = grossProfit - discountAllowed + discountReceived;

    return {
      startDate: startDate || null,
      endDate: endDate || null,
      salesRevenue,
      cogs,
      grossProfit,
      discountAllowed,
      discountReceived,
      netProfit
    };
  }

  /**
   * Generates the Balance Sheet statement.
   */
  static async getBalanceSheet(date?: Date, txContext?: any) {
    const client = txContext || prisma;
    const dateLimit = date ? new Date(date) : undefined;

    const heads = await client.accountHead.findMany({
      include: { group: true }
    });

    let assetsTotal = 0;
    let liabilitiesTotal = 0;
    let equityTotal = 0;

    const assetsList = [];
    const liabilitiesList = [];
    const equityList = [];

    for (const head of heads) {
      const entries = await client.voucherEntry.findMany({
        where: {
          accountId: head.id,
          ...(dateLimit ? { voucher: { date: { lte: dateLimit } } } : {})
        }
      });

      let balance = Number(head.openingBal);
      for (const entry of entries) {
        const amount = Number(entry.amount);
        if (head.balanceType === 'DR') {
          balance += entry.type === 'DR' ? amount : -amount;
        } else {
          balance += entry.type === 'CR' ? amount : -amount;
        }
      }

      if (balance === 0) continue;

      const groupType = head.group.type;
      const headData = { headId: head.id, name: head.name, balance };

      if (groupType === 'ASSET') {
        assetsTotal += balance;
        assetsList.push(headData);
      } else if (groupType === 'LIABILITY') {
        liabilitiesTotal += balance;
        liabilitiesList.push(headData);
      } else if (groupType === 'EQUITY') {
        equityTotal += balance;
        equityList.push(headData);
      }
    }

    // Dynamic Inventory Asset Valuation at the target date
    // We sum WAC of active stock lots (quantity > 0) at the date limit
    const activeLots = await client.inventoryLot.findMany({
      where: {
        ...(dateLimit ? { createdAt: { lte: dateLimit } } : {}),
        quantity: { gt: 0 }
      }
    });

    let stockValue = 0;
    for (const lot of activeLots) {
      const wac = await this.getProductWeightedAverageCost(lot.productId, client);
      stockValue += lot.quantity * wac;
    }

    if (stockValue > 0) {
      assetsTotal += stockValue;
      assetsList.push({
        headId: 'DYNAMIC_STOCK_VALUATION',
        name: 'Closing Stock (Valued at WAC)',
        balance: stockValue
      });
    }

    // Retained Earnings from inception up to dateLimit
    const pl = await this.getProfitLoss(undefined, dateLimit, client);
    const retainedEarnings = pl.netProfit;

    const totalEquityAndLiabilities = liabilitiesTotal + equityTotal + retainedEarnings;

    return {
      date: dateLimit || new Date(),
      assets: {
        list: assetsList,
        total: assetsTotal
      },
      liabilities: {
        list: liabilitiesList,
        total: liabilitiesTotal
      },
      equity: {
        list: equityList,
        total: equityTotal,
        retainedEarnings
      },
      totalEquityAndLiabilities,
      balanced: Math.abs(assetsTotal - totalEquityAndLiabilities) <= 0.01
    };
  }
}
