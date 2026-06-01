import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Search, Filter, ArrowUpRight, ArrowDownRight, User, Hash, Clock, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const InventoryLedgerPage: React.FC = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/movements');
      setMovements(res.data.data);
    } catch (error) {
      toast.error('Failed to load stock ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filteredMovements = movements.filter(m => 
    m.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-gold-500" />
            Stock Ledger
          </h1>
          <p className="text-dark-400 text-sm mt-1">Immutable audit trail of all inventory transactions and transfers</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 px-4 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Audit Secure</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 group-focus-within:text-gold-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by SKU, Product Name or Transaction Type..." 
            className="w-full bg-dark-900 border border-dark-700 text-white pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 bg-dark-800 border border-dark-700 px-6 py-3 rounded-2xl text-dark-300 hover:text-white transition-all font-bold">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Ledger Table */}
      <div className="card overflow-hidden border-dark-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dark-950/50 text-dark-500 border-b border-dark-800">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Item / Lot</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Delta</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {loading ? (
                <tr>
                  <td className="px-6 py-20 text-center" colSpan={6}>
                    <Loader2 className="w-10 h-10 animate-spin text-gold-500 mx-auto mb-4" />
                    <p className="text-dark-400 font-medium">Synchronizing ledger chain...</p>
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td className="px-6 py-20 text-center" colSpan={6}>
                    <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-dark-600" />
                    </div>
                    <p className="text-dark-400 font-bold">No movements recorded</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gold-500/[0.01] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-dark-500" />
                        <div>
                          <p className="text-sm font-medium text-white leading-tight">
                            {new Date(movement.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-dark-500 font-mono mt-0.5">
                            {new Date(movement.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center text-gold-500 border border-dark-700 mt-0.5">
                          <Hash className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{movement.product?.name || 'N/A'}</p>
                          <p className="text-[10px] text-dark-500 font-mono mt-1">SKU: {movement.product?.sku || 'UNKNOWN'}</p>
                          {movement.lot && (
                            <p className="text-[9px] text-gold-500/60 font-mono mt-0.5 uppercase tracking-tighter">Lot: {movement.lot.id.substring(0,8)}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider border ${
                        movement.type === 'SALE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        movement.type === 'PURCHASE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        movement.type === 'ADJUSTMENT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {movement.type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1 text-sm font-black ${movement.quantityDelta > 0 ? 'text-emerald-400' : movement.quantityDelta < 0 ? 'text-rose-400' : 'text-dark-400'}`}>
                          {movement.quantityDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : movement.quantityDelta < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                          {movement.quantityDelta > 0 ? '+' : ''}{movement.quantityDelta}
                          <span className="text-[10px] font-medium ml-1">QTY</span>
                        </div>
                        <div className={`text-[10px] font-mono font-bold ${movement.weightDelta > 0 ? 'text-emerald-400/70' : movement.weightDelta < 0 ? 'text-rose-400/70' : 'text-dark-500'}`}>
                          {movement.weightDelta > 0 ? '+' : ''}{Number(movement.weightDelta).toFixed(3)}g
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-dark-800 rounded-full flex items-center justify-center text-[10px] text-dark-400">
                          <User className="w-3 h-3" />
                        </div>
                        <p className="text-xs text-dark-300 font-medium">{movement.user?.name || 'System'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {movement.isReversed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-500 bg-rose-500/5 px-2 py-1 rounded-full border border-rose-500/20 uppercase tracking-tighter">
                          Voided
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryLedgerPage;
