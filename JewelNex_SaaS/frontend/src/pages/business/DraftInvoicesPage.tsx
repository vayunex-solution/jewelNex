import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Edit2, CheckCircle, Search, AlertCircle, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { invoiceService } from '../../services/invoiceService';

export default function DraftInvoicesPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Post Modal state
  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT'>('CASH');
  const [referenceId, setReferenceId] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getDrafts();
      setDrafts(res.data || []);
    } catch (err) {
      toast.error('Failed to load draft invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handlePostDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDraft) return;

    setPosting(true);
    try {
      const payments = [
        {
          amount: Number(selectedDraft.grandTotal),
          mode: paymentMode,
          referenceId: referenceId || undefined,
        },
      ];

      await invoiceService.postDraft(selectedDraft.id, payments);
      toast.success('Draft invoice posted successfully!');
      setSelectedDraft(null);
      fetchDrafts();
      navigate('/dashboard/inventory/ledger');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to post draft');
    } finally {
      setPosting(false);
    }
  };

  const filteredDrafts = drafts.filter((d) => {
    const term = searchQuery.toLowerCase();
    return (
      d.invoiceNumber.toLowerCase().includes(term) ||
      d.customer?.name.toLowerCase().includes(term) ||
      d.customer?.phone?.includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Draft Invoices</h1>
          <p className="text-dark-400 mt-1">Manage and finalize saved drafts before ledger commit.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/invoices')}
          className="px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-dark-950 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-gold-500/20"
        >
          <ShoppingBag className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
        {/* Search */}
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            placeholder="Search drafts by invoice number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-950 border border-dark-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-gold-500/50 outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-dark-400 text-sm">
          Loading drafts...
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center text-dark-400 text-sm">
          No draft invoices found.
        </div>
      ) : (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-950/50 text-dark-400 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Invoice Number</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Items</th>
                  <th className="px-6 py-4 font-medium text-right">Grand Total (₹)</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 text-white">
                {filteredDrafts.map((draft) => (
                  <tr key={draft.id} className="hover:bg-dark-800/20 transition-all">
                    <td className="px-6 py-4 font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gold-500" />
                      {draft.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{draft.customer?.name}</div>
                      <div className="text-xs text-dark-400">{draft.customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${draft.type === 'SALE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {draft.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-300">
                      {draft.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-200">
                      ₹{Number(draft.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => navigate(`/dashboard/invoices/edit/${draft.id}`)}
                          className="p-2 hover:bg-dark-800 rounded-lg text-dark-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
                          title="Edit Draft"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedDraft(draft);
                            setPaymentMode('CASH');
                            setReferenceId('');
                          }}
                          className="px-3 py-1.5 bg-gold-500 hover:bg-gold-400 text-dark-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Post
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl max-w-md w-full p-6 animate-scale-up">
            <h3 className="text-lg font-bold text-white mb-2">Post Invoice Draft</h3>
            <p className="text-xs text-dark-400 mb-4">
              Draft Number: <span className="text-white font-bold">{selectedDraft.invoiceNumber}</span>
            </p>

            <form onSubmit={handlePostDraftSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-dark-400 font-bold block mb-1">Amount to Pay</label>
                <div className="text-2xl font-black text-gold-400 bg-dark-950 p-3 rounded-xl border border-dark-800 text-right">
                  ₹{Number(selectedDraft.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <label className="text-xs text-dark-400 font-bold block mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'UPI', 'CARD', 'CREDIT'] as const).map(mode => (
                    <button 
                      key={mode} 
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all text-center ${paymentMode === mode ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-dark-950 border-dark-700 text-dark-300 hover:text-white'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMode !== 'CASH' && paymentMode !== 'CREDIT' && (
                <div>
                  <label className="text-xs text-dark-400 font-bold block mb-1">Reference (UTR / Transaction ID)</label>
                  <input 
                    type="text" 
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-white focus:border-gold-500/50 outline-none"
                    placeholder="Enter txn reference..."
                    required
                  />
                </div>
              )}

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Posting commits ledger movements, locks stock, and generates permanent financial entries.</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setSelectedDraft(null)} className="px-4 py-2 border border-dark-700 text-dark-300 hover:text-white rounded-lg text-sm transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={posting} className="px-5 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-dark-950 font-bold rounded-lg text-sm transition-all flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> {posting ? 'Posting...' : 'Confirm Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
