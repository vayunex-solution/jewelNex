import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Loader2, ArrowRightLeft, Activity, Gem, ArrowUpRight, ChevronRight } from 'lucide-react';
import { inventoryService, Product } from '../../services/inventoryService';
import { AddProductModal } from './components/AddProductModal';
import { RecordMovementModal } from './components/RecordMovementModal';
import { toast } from 'sonner';

const InventoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getProducts();
      setProducts(res.data);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dashboard Metrics
  const totalProducts = products.length;
  const totalStockCount = products.reduce((acc, p) => 
    acc + (p.lots?.reduce((sum: number, lot: any) => sum + lot.quantity, 0) || 0), 0
  );
  const totalFineWeight = products.reduce((acc, p) => 
    acc + (p.lots?.reduce((sum: number, lot: any) => sum + Number(lot.weight), 0) || 0), 0
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-gold-500" />
            Inventory Dashboard
          </h1>
          <p className="text-dark-400 text-sm mt-1">Real-time stock tracking and fine weight metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMovementModalOpen(true)} 
            className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white border border-dark-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <Activity className="w-4 h-4" />
            Record Movement
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-dark-950 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-gold-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Products', value: totalProducts, icon: Package, color: 'text-gold-400', bg: 'bg-gold-400/10' },
          { label: 'Stock Items', value: totalStockCount, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Fine Weight', value: `${totalFineWeight.toFixed(3)}g`, icon: Gem, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        ].map((card, i) => (
          <div key={i} className="glass p-6 rounded-2xl border-l-4 border-l-gold-500 group hover:bg-dark-800/60 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{card.label}</p>
                <h2 className="text-3xl font-black text-white tracking-tight">{card.value}</h2>
              </div>
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-dark-500">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">+0.00%</span> since last month
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 group-focus-within:text-gold-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by SKU, Name or Category..." 
            className="w-full bg-dark-900 border border-dark-700 text-white pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:border-gold-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 bg-dark-800 border border-dark-700 px-6 py-3 rounded-2xl text-dark-300 hover:text-white transition-all font-bold">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden border-dark-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dark-950/50 text-dark-500 border-b border-dark-800">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">SKU</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Product Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">In Stock</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Gross Wt.</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Net Wt.</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {loading ? (
                <tr>
                  <td className="px-6 py-20 text-center" colSpan={6}>
                    <Loader2 className="w-10 h-10 animate-spin text-gold-500 mx-auto mb-4" />
                    <p className="text-dark-400 font-medium">Scanning inventory vault...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td className="px-6 py-20 text-center" colSpan={6}>
                    <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-dark-600" />
                    </div>
                    <p className="text-dark-400 font-bold">No products found</p>
                    <p className="text-dark-600 text-sm mt-1">Try adjusting your search or add a new product</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const totalQty = product.lots?.reduce((sum: number, lot: any) => sum + lot.quantity, 0) || 0;
                  return (
                    <tr key={product.id} className="hover:bg-gold-500/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <span className="font-mono text-sm font-bold text-gold-500 bg-gold-500/10 px-2 py-1 rounded border border-gold-500/20 tracking-tighter">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-gold-400 transition-colors">{product.name}</p>
                          <p className="text-[10px] text-dark-500 uppercase tracking-tighter mt-0.5">Purity: {product.purity}K</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${totalQty > 0 ? 'text-white' : 'text-rose-400'}`}>
                            {totalQty}
                          </span>
                          {totalQty <= 10 && totalQty > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-mono text-sm text-dark-300 tracking-tighter">{Number(product.grossWeight).toFixed(3)}g</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-mono text-sm text-dark-300 tracking-tighter">{Number(product.netWeight).toFixed(3)}g</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 hover:bg-dark-800 rounded-lg text-dark-500 hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddProductModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchProducts();
          }} 
        />
      )}

      {isMovementModalOpen && (
        <RecordMovementModal
          products={products}
          onClose={() => setIsMovementModalOpen(false)}
          onSuccess={() => {
            setIsMovementModalOpen(false);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};

export default InventoryPage;
