import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Info, Package, Scale, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryService } from '../../../services/inventoryService';

const schema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  grossWeight: z.number().min(0),
  stoneWeight: z.number().min(0),
  purity: z.number().min(0).max(1),
  wastagePercent: z.number().min(0),
  makingCharge: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface AddProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ onClose, onSuccess }) => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      grossWeight: 0,
      stoneWeight: 0,
      purity: 0.916, // Default 22K
      wastagePercent: 0,
      makingCharge: 0
    }
  });

  const grossWeight = watch('grossWeight') || 0;
  const stoneWeight = watch('stoneWeight') || 0;
  const netWeight = Math.max(0, grossWeight - stoneWeight);
  const fineWeight = netWeight * (watch('purity') || 0);

  const onSubmit = async (data: FormData) => {
    try {
      await inventoryService.createProduct({
        ...data,
        netWeight,
        fineWeight,
      });
      toast.success('Product created successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-dark-800 bg-dark-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Add New Product</h2>
              <p className="text-dark-500 text-xs">Define a new inventory item with precise metrics</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-800 text-dark-400 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column: Basic Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gold-500" />
                <h3 className="text-[10px] font-black text-dark-500 uppercase tracking-widest">General Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 block ml-1">SKU / System Code</label>
                  <input 
                    {...register('sku')} 
                    className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-mono font-bold tracking-tight" 
                    placeholder="e.g. RNG-GOLD-22K-001" 
                  />
                  {errors.sku && <p className="text-rose-400 text-[10px] font-bold mt-1.5 ml-1">{errors.sku.message}</p>}
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 block ml-1">Display Name</label>
                  <input 
                    {...register('name')} 
                    className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-bold" 
                    placeholder="e.g. Traditional Bridal Ring" 
                  />
                  {errors.name && <p className="text-rose-400 text-[10px] font-bold mt-1.5 ml-1">{errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 block ml-1">Notes / Description</label>
                  <textarea 
                    {...register('description')} 
                    className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all min-h-[120px] resize-none" 
                    placeholder="Describe craftsmanship or special features..." 
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Weight & Pricing */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-gold-500" />
                <h3 className="text-[10px] font-black text-dark-500 uppercase tracking-widest">Weight Metrics & Costs</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 block ml-1">Gross (g)</label>
                  <input type="number" step="0.001" {...register('grossWeight', { valueAsNumber: true })} className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 block ml-1">Stone (g)</label>
                  <input type="number" step="0.001" {...register('stoneWeight', { valueAsNumber: true })} className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-mono font-bold" />
                </div>
              </div>

              <div className="p-5 bg-gold-500/5 border border-gold-500/10 rounded-2xl flex justify-between items-center group hover:bg-gold-500/10 transition-all">
                <div>
                  <p className="text-[10px] font-black text-gold-500 uppercase tracking-widest">Calculated Net Weight</p>
                  <p className="text-2xl font-black text-white mt-1 font-mono tracking-tighter">{netWeight.toFixed(3)}g</p>
                </div>
                <Calculator className="w-8 h-8 text-gold-500/20 group-hover:text-gold-500 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 block ml-1">Purity (K/%)</label>
                  <input type="number" step="0.001" {...register('purity', { valueAsNumber: true })} className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 block ml-1">Fine Wt. (g)</label>
                  <div className="w-full bg-dark-950 border border-dark-800 text-dark-500 px-5 py-4 rounded-2xl font-mono font-black italic">
                    {fineWeight.toFixed(3)}g
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 block ml-1">Wastage %</label>
                  <input type="number" step="0.01" {...register('wastagePercent', { valueAsNumber: true })} className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 block ml-1">Making Charge</label>
                  <input type="number" step="0.01" {...register('makingCharge', { valueAsNumber: true })} className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-mono font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-dark-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-8 py-4 rounded-2xl text-dark-400 hover:text-white hover:bg-dark-800 transition-all font-bold"
            >
              Discard
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-gold-600 hover:bg-gold-500 text-dark-950 px-10 py-4 rounded-2xl font-black transition-all shadow-lg shadow-gold-600/20 disabled:opacity-50 flex items-center gap-3"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isSubmitting ? 'Finalizing...' : 'Commit Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
