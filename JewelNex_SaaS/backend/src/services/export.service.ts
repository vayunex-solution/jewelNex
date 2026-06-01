import ExcelJS from 'exceljs';
import { AccountingService } from './accounting.service';
import prisma from '../config/database';

const GOLD = 'FFC9A84C';
const DARK = 'FF1A1A1A';
const HEADER_BG = 'FF2D2D2D';

function applyHeaderStyle(row: ExcelJS.Row, bgColor = HEADER_BG) {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF555555' } },
      bottom: { style: 'thin', color: { argb: 'FF555555' } },
    };
  });
  row.height = 22;
}

function applyDataStyle(row: ExcelJS.Row, isEven: boolean) {
  const bg = isEven ? 'FFF5F5F5' : 'FFFFFFFF';
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font = { size: 9 };
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 18;
}

function addWorkbookMeta(workbook: ExcelJS.Workbook, title: string, company: string) {
  workbook.creator = 'VayuNex Solution';
  workbook.created = new Date();
  workbook.title = title;
  workbook.company = company;
}

export class ExportService {
  // ─── TRIAL BALANCE XLSX ────────────────────────────────────────────
  static async exportTrialBalanceXLSX(date?: Date): Promise<ExcelJS.Workbook> {
    const tb = await AccountingService.getTrialBalance(date);
    const workbook = new ExcelJS.Workbook();
    addWorkbookMeta(workbook, 'Trial Balance', 'JewelNex');

    const sheet = workbook.addWorksheet('Trial Balance', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true }
    });

    // Title row
    sheet.mergeCells('A1:E1');
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = `Trial Balance — ${new Date(tb.date).toLocaleDateString('en-IN')}`;
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: DARK } };
    titleRow.height = 28;

    // Header
    sheet.columns = [
      { header: 'Account Head', key: 'head', width: 40 },
      { header: 'Group', key: 'group', width: 24 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Debit (₹)', key: 'debit', width: 16, style: { numFmt: '#,##0.00' } },
      { header: 'Credit (₹)', key: 'credit', width: 16, style: { numFmt: '#,##0.00' } },
    ];
    const headerRow = sheet.getRow(2);
    applyHeaderStyle(headerRow, HEADER_BG);

    // Data rows
    tb.rows.forEach((row, idx) => {
      const r = sheet.addRow({
        head: row.headName,
        group: row.groupName,
        type: row.groupType,
        debit: row.debit || null,
        credit: row.credit || null,
      });
      applyDataStyle(r, idx % 2 === 0);
      if (row.debit > 0) r.getCell('debit').font = { size: 9, bold: true };
      if (row.credit > 0) r.getCell('credit').font = { size: 9, bold: true };
    });

    // Totals row
    const totalRow = sheet.addRow({
      head: 'TOTAL',
      group: '',
      type: '',
      debit: tb.totalDebit,
      credit: tb.totalCredit,
    });
    applyHeaderStyle(totalRow, GOLD);
    totalRow.getCell('head').font = { bold: true, size: 10, color: { argb: DARK } };
    ['debit', 'credit'].forEach(k => {
      totalRow.getCell(k).font = { bold: true, size: 10, color: { argb: DARK } };
    });

    // Balanced indicator
    const balRow = sheet.addRow({ head: tb.balanced ? '✅ Balanced' : '❌ Out of Balance' });
    balRow.getCell('head').font = {
      bold: true, size: 10,
      color: { argb: tb.balanced ? 'FF27AE60' : 'FFC0392B' }
    };

    return workbook;
  }

  // ─── DAY BOOK XLSX ─────────────────────────────────────────────────
  static async exportDayBookXLSX(startDate?: Date, endDate?: Date): Promise<ExcelJS.Workbook> {
    const dayBook = await AccountingService.getDayBook(startDate, endDate);
    const workbook = new ExcelJS.Workbook();
    addWorkbookMeta(workbook, 'Day Book', 'JewelNex');

    const sheet = workbook.addWorksheet('Day Book');
    sheet.columns = [
      { header: 'Voucher No', key: 'vno', width: 20 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Narration', key: 'narration', width: 40 },
      { header: 'Account', key: 'account', width: 30 },
      { header: 'Debit (₹)', key: 'debit', width: 16, style: { numFmt: '#,##0.00' } },
      { header: 'Credit (₹)', key: 'credit', width: 16, style: { numFmt: '#,##0.00' } },
    ];
    applyHeaderStyle(sheet.getRow(1));

    let rowIdx = 0;
    for (const voucher of dayBook) {
      for (const entry of voucher.entries) {
        const r = sheet.addRow({
          vno: voucher.voucherNumber,
          type: voucher.type,
          date: new Date(voucher.date).toLocaleDateString('en-IN'),
          narration: voucher.narration || '',
          account: entry.account?.name || entry.accountId,
          debit: entry.type === 'DR' ? Number(entry.amount) : null,
          credit: entry.type === 'CR' ? Number(entry.amount) : null,
        });
        applyDataStyle(r, rowIdx % 2 === 0);
        rowIdx++;
      }
    }

    return workbook;
  }

  // ─── GENERAL LEDGER XLSX ───────────────────────────────────────────
  static async exportGeneralLedgerXLSX(accountId: string, startDate?: Date, endDate?: Date): Promise<ExcelJS.Workbook> {
    const ledger = await AccountingService.getGeneralLedger(accountId, startDate, endDate);
    const workbook = new ExcelJS.Workbook();
    addWorkbookMeta(workbook, `Ledger: ${ledger.head.name}`, 'JewelNex');

    const sheet = workbook.addWorksheet('Ledger');
    sheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Voucher No', key: 'vno', width: 20 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Narration', key: 'narration', width: 40 },
      { header: 'Debit (₹)', key: 'debit', width: 16, style: { numFmt: '#,##0.00' } },
      { header: 'Credit (₹)', key: 'credit', width: 16, style: { numFmt: '#,##0.00' } },
      { header: 'Balance (₹)', key: 'balance', width: 16, style: { numFmt: '#,##0.00' } },
    ];
    applyHeaderStyle(sheet.getRow(1));

    // Opening balance row
    const openRow = sheet.addRow({
      date: '',
      vno: '',
      type: 'OPENING',
      narration: 'Opening Balance',
      debit: null,
      credit: null,
      balance: ledger.openingBalance,
    });
    openRow.getCell('narration').font = { italic: true, color: { argb: 'FF666666' } };

    ledger.entries.forEach((entry: any, idx: number) => {
      const r = sheet.addRow({
        date: new Date(entry.voucher.date).toLocaleDateString('en-IN'),
        vno: entry.voucher.voucherNumber,
        type: entry.voucher.type,
        narration: entry.voucher.narration || '',
        debit: entry.type === 'DR' ? entry.amount : null,
        credit: entry.type === 'CR' ? entry.amount : null,
        balance: entry.runningBalance,
      });
      applyDataStyle(r, idx % 2 === 0);
    });

    // Closing balance row
    const closeRow = sheet.addRow({
      narration: 'Closing Balance',
      balance: ledger.closingBalance,
    });
    applyHeaderStyle(closeRow, GOLD);
    closeRow.eachCell(c => { c.font = { bold: true, size: 9, color: { argb: DARK } }; });

    return workbook;
  }

  // ─── INVOICE REGISTER CSV ──────────────────────────────────────────
  static async exportInvoiceRegisterCSV(startDate?: Date, endDate?: Date): Promise<string> {
    const whereClause: any = { status: { not: 'DRAFT' } };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: { customer: true, payments: true },
      orderBy: { createdAt: 'asc' }
    });

    const escapeCSV = (val: string | number | null | undefined) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['Invoice No', 'Date', 'Type', 'Status', 'Customer', 'Phone', 'GSTIN', 'Sub Total', 'Tax Total', 'Discount', 'Grand Total', 'Payment Mode', 'Reference'];
    const rows = invoices.map(inv => {
      const payModes = inv.payments.map(p => p.mode).join(';');
      const payRefs = inv.payments.map(p => p.referenceId || '').join(';');
      return [
        inv.invoiceNumber,
        new Date(inv.createdAt).toLocaleDateString('en-IN'),
        inv.type,
        inv.status,
        inv.customer.name,
        inv.customer.phone || '',
        inv.customer.gstNumber || '',
        Number(inv.subTotal).toFixed(2),
        Number(inv.taxTotal).toFixed(2),
        Number(inv.discount).toFixed(2),
        Number(inv.grandTotal).toFixed(2),
        payModes,
        payRefs,
      ].map(escapeCSV).join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }
}
