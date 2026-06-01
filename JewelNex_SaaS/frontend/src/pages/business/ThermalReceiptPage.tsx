import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { invoiceListService, PostedInvoice } from '../../services/invoiceListService';
import { settingsService, CompanySettings } from '../../services/settingsService';

function formatCurrency(val: number | string, symbol = '₹') {
  return `${symbol}${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ThermalReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<PostedInvoice & { items?: any[] } | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      invoiceListService.getById(id),
      settingsService.getCompanySettings(),
    ]).then(([inv, cfg]) => {
      setInvoice(inv as any);
      setSettings(cfg);
      setLoading(false);
      // Auto-print after render
      setTimeout(() => window.print(), 800);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Preparing receipt...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !settings) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-red-500">Invoice not found.</p>
      </div>
    );
  }

  const items = (invoice as any).items || [];
  const grandTotal = Number(invoice.grandTotal);
  const subTotal = Number(invoice.subTotal);
  const taxTotal = Number(invoice.taxTotal);
  const discount = Number(invoice.discount);
  const isIGST = settings.gstType === 'IGST';

  const totalPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = grandTotal - totalPaid;

  return (
    <>
      {/* Screen wrapper — dark background for screen view, hidden in print */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { background: #1a1a1a; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 40px 20px; }
        
        .receipt-wrapper { background: #fff; width: 80mm; font-family: 'Courier Prime', 'Courier New', monospace; font-size: 12px; color: #000; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        
        .receipt-inner { padding: 8mm 6mm; }
        
        .dotted { border-top: 1px dashed #999; margin: 6px 0; }
        .solid { border-top: 1px solid #000; margin: 4px 0; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .small { font-size: 10px; }
        .large { font-size: 15px; }
        .xlarge { font-size: 18px; }
        .flex-row { display: flex; justify-content: space-between; align-items: baseline; gap: 4px; }
        .flex-row .label { flex: 1; }
        .flex-row .val { text-align: right; white-space: nowrap; }
        
        .print-btn { position: fixed; bottom: 24px; right: 24px; background: #C9A84C; color: #fff; border: none; border-radius: 12px; padding: 12px 24px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 20px rgba(201,168,76,0.4); }
        .close-btn { position: fixed; bottom: 24px; left: 24px; background: #333; color: #fff; border: none; border-radius: 12px; padding: 12px 24px; font-size: 14px; cursor: pointer; }
        
        @media print {
          body { background: #fff; padding: 0; display: block; }
          .receipt-wrapper { box-shadow: none; width: 80mm; }
          .print-btn, .close-btn { display: none !important; }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>

      <div className="receipt-wrapper">
        <div className="receipt-inner">
          {/* Shop Header */}
          <div className="center">
            {settings.logoBase64 && (
              <img
                src={settings.logoBase64}
                alt="logo"
                style={{ maxWidth: '40mm', maxHeight: '15mm', margin: '0 auto 4px', display: 'block', objectFit: 'contain' }}
              />
            )}
            <div className="xlarge bold">{settings.name}</div>
            {settings.tagline && <div className="small" style={{ color: '#555' }}>{settings.tagline}</div>}
            {settings.address && <div className="small">{settings.address}</div>}
            {(settings.city || settings.state) && (
              <div className="small">{[settings.city, settings.state, settings.pincode].filter(Boolean).join(', ')}</div>
            )}
            {settings.phone && <div className="small">Tel: {settings.phone}</div>}
            {settings.gstin && <div className="small bold">GSTIN: {settings.gstin}</div>}
          </div>

          <div className="dotted" />

          {/* Invoice Type Banner */}
          <div className="center bold large">
            {invoice.type === 'SALE' ? '★ TAX INVOICE ★' : invoice.type === 'PURCHASE' ? '★ PURCHASE INVOICE ★' : '★ ESTIMATE ★'}
          </div>

          <div className="dotted" />

          {/* Invoice Details */}
          <div className="flex-row"><span className="label">Invoice No:</span><span className="val bold">{invoice.invoiceNumber}</span></div>
          <div className="flex-row"><span className="label">Date:</span><span className="val">{formatDate(invoice.createdAt)}</span></div>
          <div className="flex-row"><span className="label">Customer:</span><span className="val bold">{invoice.customer.name}</span></div>
          {invoice.customer.phone && (
            <div className="flex-row"><span className="label">Phone:</span><span className="val">{invoice.customer.phone}</span></div>
          )}

          <div className="dotted" />

          {/* Items */}
          <div className="bold small" style={{ marginBottom: '4px' }}>ITEMS</div>
          {items.map((item: any, i: number) => {
            const itemAmount = Number(item.amount);
            const gstPct = Number(item.gstPercent);
            const base = itemAmount / (1 + gstPct / 100);
            const gst = itemAmount - base;
            return (
              <div key={i} style={{ marginBottom: '6px', borderBottom: '1px dotted #ddd', paddingBottom: '4px' }}>
                <div className="bold">{item.product?.name || 'Item'}</div>
                <div className="small" style={{ color: '#444' }}>
                  HSN: {item.hsn || '-'} | Purity: {item.purity}% | Wt: {Number(item.weight).toFixed(3)}g
                </div>
                <div className="small" style={{ color: '#444' }}>
                  Qty: {item.quantity} × Rate: {formatCurrency(item.rate)} | Making: {formatCurrency(item.makingCharge)}
                </div>
                <div className="flex-row">
                  <span className="small label">GST {gstPct}%: {formatCurrency(gst)}</span>
                  <span className="bold val">{formatCurrency(itemAmount)}</span>
                </div>
              </div>
            );
          })}

          <div className="solid" />

          {/* Totals */}
          <div className="flex-row"><span className="label">Sub Total</span><span className="val">{formatCurrency(subTotal)}</span></div>
          {isIGST ? (
            <div className="flex-row"><span className="label">IGST</span><span className="val">{formatCurrency(taxTotal)}</span></div>
          ) : (
            <>
              <div className="flex-row"><span className="label">CGST</span><span className="val">{formatCurrency(taxTotal / 2)}</span></div>
              <div className="flex-row"><span className="label">SGST</span><span className="val">{formatCurrency(taxTotal / 2)}</span></div>
            </>
          )}
          {discount > 0 && (
            <div className="flex-row"><span className="label">Discount</span><span className="val">- {formatCurrency(discount)}</span></div>
          )}

          <div className="solid" />

          <div className="flex-row xlarge bold">
            <span className="label">TOTAL</span>
            <span className="val">{formatCurrency(grandTotal)}</span>
          </div>

          <div className="solid" />

          {/* Payments */}
          <div className="bold small" style={{ marginBottom: '4px' }}>PAYMENT</div>
          {invoice.payments.map((p, i) => (
            <div key={i} className="flex-row">
              <span className="label">{p.mode}{p.referenceId ? ` (${p.referenceId})` : ''}</span>
              <span className="val">{formatCurrency(p.amount)}</span>
            </div>
          ))}
          {Math.abs(balance) > 0.01 && (
            <div className="flex-row bold">
              <span className="label" style={{ color: balance > 0 ? '#c0392b' : '#27ae60' }}>
                {balance > 0 ? 'Balance Due' : 'Advance'}
              </span>
              <span className="val" style={{ color: balance > 0 ? '#c0392b' : '#27ae60' }}>
                {formatCurrency(Math.abs(balance))}
              </span>
            </div>
          )}

          <div className="dotted" />

          {/* Footer */}
          <div className="center">
            <div className="bold small">{settings.invoiceFooter || 'Thank you for your business!'}</div>
            <div className="small" style={{ color: '#888', marginTop: '8px' }}>
              Powered by VayuNex Solution
            </div>
            <div className="small" style={{ color: '#999', marginTop: '2px' }}>
              {settings.website || 'www.vayunexsolution.com'}
            </div>
          </div>

          {/* Tear guide */}
          <div style={{ marginTop: '12px', borderTop: '1px dashed #bbb' }} />
        </div>
      </div>

      {/* Screen-only buttons */}
      <button className="print-btn" onClick={() => window.print()}>🖨 Print Receipt</button>
      <button className="close-btn" onClick={() => window.close()}>✕ Close</button>
    </>
  );
}
