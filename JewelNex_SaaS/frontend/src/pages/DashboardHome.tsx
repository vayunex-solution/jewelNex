import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  FileText, 
  Users, 
  IndianRupee, 
  Gem, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  AlertTriangle,
  PlusCircle,
  ArrowRightLeft,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { inventoryService } from '../services/inventoryService';
import { toast } from 'sonner';

interface DashboardStats {
  totalProducts: number;
  totalQuantity: number;
  totalWeight: number;
  recentMovements: any[];
  lowStockItems: any[];
}

const DashboardHome: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await inventoryService.getStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
        // toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const metricCards = [
    { 
      label: 'Total Products', 
      value: stats?.totalProducts ?? 0, 
      icon: Package, 
      color: 'text-gold-400', 
      bg: 'bg-gold-400/10',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Stock Quantity', 
      value: stats?.totalQuantity ?? 0, 
      icon: Gem, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-400/10',
      trend: '+5%',
      trendUp: true
    },
    { 
      label: 'Total Weight', 
      value: `${(Number(stats?.totalWeight || 0)).toFixed(2)}g`, 
      icon: IndianRupee, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10',
      trend: '-2%',
      trendUp: false
    },
    { 
      label: 'Active Locations', 
      value: '4', 
      icon: Users, 
      color: 'text-purple-400', 
      bg: 'bg-purple-400/10',
      trend: 'Stable',
      trendUp: true
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
          <p className="text-dark-400 animate-pulse font-medium">Powering up your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-200">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-dark-400 text-sm mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-dark-950 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-gold-600/20 whitespace-nowrap">
            <PlusCircle className="w-4 h-4" />
            Stock Inward
          </button>
          <button className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white border border-dark-700 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap">
            <ArrowRightLeft className="w-4 h-4" />
            Transfer
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, idx) => (
          <div key={idx} className="group relative bg-dark-900/50 border border-dark-700 p-6 rounded-2xl hover:border-gold-500/50 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gold-500/10 transition-colors" />
            
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center shadow-inner`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${card.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            
            <div className="relative z-10">
              <p className="text-dark-500 text-xs font-bold uppercase tracking-widest">{card.label}</p>
              <h3 className="text-3xl font-black text-white mt-1 group-hover:scale-105 transition-transform origin-left">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="xl:col-span-2 card border-dark-700 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-600/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gold-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Stock Movements</h3>
            </div>
            <button className="text-xs text-gold-500 hover:text-gold-400 font-bold uppercase tracking-wider">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dark-800">
                  <th className="pb-4 text-xs font-bold text-dark-500 uppercase tracking-wider">Product</th>
                  <th className="pb-4 text-xs font-bold text-dark-500 uppercase tracking-wider">Type</th>
                  <th className="pb-4 text-xs font-bold text-dark-500 uppercase tracking-wider">Qty</th>
                  <th className="pb-4 text-xs font-bold text-dark-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {stats?.recentMovements?.map((m, i) => (
                  <tr key={i} className="hover:bg-dark-800/30 transition-colors group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center text-xs font-bold text-dark-400 border border-dark-700">
                          {m.product.sku.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{m.product.name}</p>
                          <p className="text-[10px] text-dark-500">{m.product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${
                        m.type === 'SALE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        m.type === 'PURCHASE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="py-4">
                      <p className={`text-sm font-black ${m.quantityDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.quantityDelta > 0 ? '+' : ''}{m.quantityDelta}
                      </p>
                    </td>
                    <td className="py-4 text-dark-500 text-xs">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!stats?.recentMovements?.length && [1, 2, 3].map(i => (
                   <tr key={i} className="opacity-40">
                     <td className="py-4"><div className="skeleton h-8 w-32 rounded-lg" /></td>
                     <td className="py-4"><div className="skeleton h-6 w-16 rounded-full" /></td>
                     <td className="py-4"><div className="skeleton h-4 w-10 rounded" /></td>
                     <td className="py-4"><div className="skeleton h-4 w-20 rounded" /></td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="card border-dark-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Low Stock</h3>
            </div>

            <div className="space-y-4">
              {stats?.lowStockItems?.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 border border-dark-700 hover:border-rose-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark-950 rounded flex items-center justify-center text-rose-500 font-bold border border-dark-700">
                      !
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none">{item.product.name}</p>
                      <p className="text-[10px] text-dark-500 mt-1">Only {item.quantity} units left</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-dark-700 rounded-lg text-gold-500 transition-colors">
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {!stats?.lowStockItems?.length && (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 text-dark-700 mx-auto mb-2 opacity-20" />
                  <p className="text-dark-500 text-xs italic">All stock levels are optimal</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Chart Placeholder */}
          <div className="card border-dark-700 bg-gradient-to-br from-dark-900 to-dark-950">
            <h4 className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-4">Inventory Value</h4>
            <div className="h-32 flex items-end gap-2 px-2">
              {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-gold-600/20 hover:bg-gold-500/50 transition-all rounded-t-sm" 
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-dark-600 font-bold px-1">
              <span>MON</span>
              <span>SUN</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardHome;
