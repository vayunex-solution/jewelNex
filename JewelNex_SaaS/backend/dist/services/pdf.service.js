"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const database_1 = __importDefault(require("../config/database"));
const settings_service_1 = require("./settings.service");
// Colour palette
const GOLD = '#C9A84C';
const DARK = '#1A1A1A';
const MUTED = '#666666';
const LIGHT_GREY = '#F5F5F5';
const WHITE = '#FFFFFF';
const LINE = '#E0E0E0';
function formatCurrency(amount, symbol = '₹') {
    const num = Number(amount || 0);
    return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}
class PDFService {
    static async generateInvoicePDF(invoiceId) {
        // 1. Fetch invoice with all relations
        const invoice = await database_1.default.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                items: { include: { product: true } },
                payments: true,
            }
        });
        if (!invoice)
            throw new Error('Invoice not found.');
        // 2. Fetch company settings
        const settings = await settings_service_1.SettingsService.getSettings();
        // 3. Create PDF document
        const doc = new pdfkit_1.default({
            size: 'A4',
            margin: 0,
            bufferPages: true,
            info: {
                Title: `Invoice ${invoice.invoiceNumber}`,
                Author: settings.name,
                Subject: `${invoice.type} Invoice`,
            }
        });
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;
        // ─── HEADER BAND ───────────────────────────────────────────────
        // Gold background header
        doc.rect(0, 0, pageWidth, 110).fill(DARK);
        // Company Name
        doc.fillColor(GOLD)
            .font('Helvetica-Bold')
            .fontSize(22)
            .text(settings.name, margin, 22, { width: contentWidth * 0.65 });
        // Tagline
        if (settings.tagline) {
            doc.fillColor(WHITE)
                .font('Helvetica')
                .fontSize(9)
                .text(settings.tagline, margin, 50, { width: contentWidth * 0.65 });
        }
        // GSTIN in header
        if (settings.gstin) {
            doc.fillColor('#AAA')
                .font('Helvetica')
                .fontSize(8)
                .text(`GSTIN: ${settings.gstin}`, margin, 66);
        }
        // Invoice badge on top right
        const badgeLabel = invoice.type === 'SALE' ? 'TAX INVOICE' :
            invoice.type === 'PURCHASE' ? 'PURCHASE INVOICE' : 'ESTIMATE';
        doc.roundedRect(pageWidth - margin - 140, 20, 140, 70, 8).fill(GOLD);
        doc.fillColor(DARK)
            .font('Helvetica-Bold')
            .fontSize(11)
            .text(badgeLabel, pageWidth - margin - 135, 30, { width: 130, align: 'center' });
        doc.fillColor(DARK)
            .font('Helvetica')
            .fontSize(8)
            .text(invoice.invoiceNumber, pageWidth - margin - 135, 48, { width: 130, align: 'center' });
        doc.fillColor(DARK)
            .font('Helvetica')
            .fontSize(8)
            .text(formatDate(invoice.createdAt), pageWidth - margin - 135, 62, { width: 130, align: 'center' });
        let y = 125;
        // ─── BILLING SECTION ───────────────────────────────────────────
        // Bill To (left) | Invoice Details (right)
        doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
            .text('BILL TO', margin, y);
        doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
            .text('INVOICE DETAILS', pageWidth / 2 + 10, y);
        y += 14;
        // Customer block
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
            .text(invoice.customer.name, margin, y, { width: contentWidth * 0.48 });
        // Invoice details block
        const detailsX = pageWidth / 2 + 10;
        const detailsW = contentWidth / 2 - 10;
        const details = [
            ['Invoice No', invoice.invoiceNumber],
            ['Date', formatDate(invoice.createdAt)],
            ['Type', invoice.type],
            ['Status', invoice.status],
        ];
        details.forEach(([label, value], i) => {
            doc.fillColor(MUTED).font('Helvetica').fontSize(8)
                .text(label, detailsX, y + i * 14, { width: 80, continued: false });
            doc.fillColor(DARK).font('Helvetica').fontSize(8)
                .text(value, detailsX + 85, y + i * 14);
        });
        // Customer address if available
        y += 16;
        if (invoice.customer.phone || invoice.customer.email) {
            const contactLines = [
                invoice.customer.phone ? `📞 ${invoice.customer.phone}` : '',
                invoice.customer.email ? `✉ ${invoice.customer.email}` : '',
                invoice.customer.gstNumber ? `GSTIN: ${invoice.customer.gstNumber}` : '',
            ].filter(Boolean).join('  |  ');
            doc.fillColor(MUTED).font('Helvetica').fontSize(8)
                .text(contactLines, margin, y, { width: contentWidth * 0.48 });
        }
        y += 30;
        // ─── ITEMS TABLE ───────────────────────────────────────────────
        // Table header
        doc.rect(margin, y, contentWidth, 22).fill(DARK);
        const cols = [
            { label: '#', x: margin + 4, width: 20, align: 'center' },
            { label: 'Item / Product', x: margin + 24, width: 140, align: 'left' },
            { label: 'HSN', x: margin + 164, width: 50, align: 'center' },
            { label: 'Qty', x: margin + 214, width: 30, align: 'center' },
            { label: 'Wt(g)', x: margin + 244, width: 40, align: 'center' },
            { label: 'Rate', x: margin + 284, width: 55, align: 'right' },
            { label: 'Making', x: margin + 339, width: 50, align: 'right' },
            { label: 'GST%', x: margin + 389, width: 35, align: 'center' },
            { label: 'Amount', x: margin + 424, width: contentWidth - 424, align: 'right' },
        ];
        cols.forEach(col => {
            doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(7)
                .text(col.label, col.x, y + 7, { width: col.width, align: col.align });
        });
        y += 22;
        // Table rows
        let totalSubtotal = 0;
        let totalGST = 0;
        const items = invoice.items;
        items.forEach((item, idx) => {
            const rowY = y;
            const bg = idx % 2 === 0 ? WHITE : LIGHT_GREY;
            doc.rect(margin, rowY, contentWidth, 18).fill(bg);
            const amount = Number(item.amount);
            const gstPct = Number(item.gstPercent);
            const baseAmount = amount / (1 + gstPct / 100);
            const gstAmount = amount - baseAmount;
            totalSubtotal += baseAmount;
            totalGST += gstAmount;
            const rowData = [
                { val: String(idx + 1), x: margin + 4, w: 20, align: 'center' },
                { val: item.product.name, x: margin + 24, w: 140, align: 'left' },
                { val: item.hsn || '-', x: margin + 164, w: 50, align: 'center' },
                { val: String(item.quantity), x: margin + 214, w: 30, align: 'center' },
                { val: Number(item.weight).toFixed(3), x: margin + 244, w: 40, align: 'center' },
                { val: formatCurrency(Number(item.rate), ''), x: margin + 284, w: 55, align: 'right' },
                { val: formatCurrency(Number(item.makingCharge), ''), x: margin + 339, w: 50, align: 'right' },
                { val: `${gstPct}%`, x: margin + 389, w: 35, align: 'center' },
                { val: formatCurrency(Number(item.amount)), x: margin + 424, w: contentWidth - 424, align: 'right' },
            ];
            rowData.forEach(cell => {
                doc.fillColor(DARK).font('Helvetica').fontSize(7)
                    .text(cell.val, cell.x, rowY + 5, { width: cell.w, align: cell.align });
            });
            y += 18;
        });
        // Table bottom border
        doc.rect(margin, y, contentWidth, 1).fill(LINE);
        y += 10;
        // ─── TOTALS ────────────────────────────────────────────────────
        const totalsX = pageWidth - margin - 200;
        const totalsW = 200;
        const grandTotal = Number(invoice.grandTotal);
        const discount = Number(invoice.discount);
        const isIGST = settings.gstType === 'IGST';
        const totalsRows = [
            ['Sub Total', formatCurrency(totalSubtotal)],
        ];
        if (isIGST) {
            totalsRows.push(['IGST', formatCurrency(totalGST)]);
        }
        else {
            const halfGST = totalGST / 2;
            totalsRows.push(['CGST', formatCurrency(halfGST)]);
            totalsRows.push(['SGST', formatCurrency(halfGST)]);
        }
        if (discount > 0)
            totalsRows.push(['Discount', `- ${formatCurrency(discount)}`]);
        totalsRows.forEach(([label, val]) => {
            doc.fillColor(MUTED).font('Helvetica').fontSize(9)
                .text(label, totalsX, y, { width: 100 });
            doc.fillColor(DARK).font('Helvetica').fontSize(9)
                .text(val, totalsX + 100, y, { width: 100, align: 'right' });
            y += 16;
        });
        // Grand Total band
        doc.rect(totalsX - 5, y, totalsW + 5, 26).fill(GOLD);
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
            .text('GRAND TOTAL', totalsX, y + 7, { width: 100 });
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
            .text(formatCurrency(grandTotal), totalsX + 100, y + 7, { width: 100, align: 'right' });
        y += 36;
        // ─── PAYMENTS ──────────────────────────────────────────────────
        if (invoice.payments && invoice.payments.length > 0) {
            doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text('PAYMENT SUMMARY', margin, y);
            y += 12;
            invoice.payments.forEach(pay => {
                doc.fillColor(DARK).font('Helvetica').fontSize(8)
                    .text(`${pay.mode}${pay.referenceId ? ` (Ref: ${pay.referenceId})` : ''}`, margin, y, { width: 200 });
                doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8)
                    .text(formatCurrency(Number(pay.amount)), margin + 200, y, { width: 100, align: 'right' });
                y += 14;
            });
            const totalPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
            const balance = grandTotal - totalPaid;
            if (Math.abs(balance) > 0.01) {
                doc.fillColor(balance > 0 ? '#c0392b' : '#27ae60').font('Helvetica-Bold').fontSize(8)
                    .text(balance > 0 ? `Balance Due: ${formatCurrency(balance)}` : `Advance: ${formatCurrency(Math.abs(balance))}`, margin, y);
                y += 14;
            }
        }
        y += 16;
        // ─── NOTES ─────────────────────────────────────────────────────
        if (invoice.notes) {
            doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text('NOTES', margin, y);
            y += 12;
            doc.fillColor(DARK).font('Helvetica').fontSize(8)
                .text(invoice.notes, margin, y, { width: contentWidth });
            y += 20;
        }
        // ─── FOOTER ────────────────────────────────────────────────────
        const footerY = pageHeight - 55;
        doc.rect(0, footerY, pageWidth, 55).fill(DARK);
        // Custom invoice footer
        const footerText = settings.invoiceFooter || 'Thank you for your business!';
        doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9)
            .text(footerText, margin, footerY + 10, { width: contentWidth, align: 'center' });
        // Shop address + contact
        const footerContact = [
            settings.address,
            settings.city && settings.state ? `${settings.city}, ${settings.state} ${settings.pincode || ''}`.trim() : '',
            settings.phone ? `📞 ${settings.phone}` : '',
            settings.email ? `✉ ${settings.email}` : '',
        ].filter(Boolean).join('  ·  ');
        doc.fillColor(WHITE).font('Helvetica').fontSize(7)
            .text(footerContact, margin, footerY + 27, { width: contentWidth - 150, align: 'left' });
        // Powered by VayuNex
        doc.fillColor('#888888').font('Helvetica').fontSize(6)
            .text('Powered by VayuNex Solution', margin, footerY + 42, { width: contentWidth, align: 'right' });
        doc.end();
        return doc;
    }
}
exports.PDFService = PDFService;
//# sourceMappingURL=pdf.service.js.map