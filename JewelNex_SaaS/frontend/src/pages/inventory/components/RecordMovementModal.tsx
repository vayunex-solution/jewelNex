import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, ArrowRightLeft, MapPin, Package, ClipboardList, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryService, Product } from '../../../services/inventoryService';
import { locationService, InventoryLocation } from '../../../services/locationService';

const schema = z.object({
  productId: z.string().min(1, 'Product is required'),
  type: z.enum(['OPENING', 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT']),
  quantityDelta: z.number().int().refine(val => val !== 0, 'Quantity cannot be zero'),
  weightDelta: z.number().refine(val => val !== 0, 'Weight cannot be zero'),
  locationId: z.string().uuid('Please select a location'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RecordMovementModalProps {
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
}

export const RecordMovementModal: React.FC<RecordMovementModalProps> = ({ onClose, onSuccess, products }) => {
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'PURCHASE',
      quantityDelta: 1,
      weightDelta: 0,
    }
  });

  useEffect(() => {
    locationService.getLocations().then(res => setLocations(res.data));
  }, []);

  const selectedType = watch('type');
  
  const onSubmit = async (data: FormData) => {
    try {
      await inventoryService.recordMovement({
        productId: data.productId,
        type: data.type,
        quantityDelta: data.quantityDelta,
        weightDelta: data.weightDelta,
        toLocationId: ['PURCHASE', 'RETURN', 'OPENING'].includes(data.type) ? data.locationId : undefined,
        fromLocationId: data.type === 'SALE' ? data.locationId : undefined,
      });
      toast.success('Stock movement recorded successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record movement');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-dark-800 bg-dark-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Record Movement</h2>
              <p className="text-dark-500 text-xs">Update stock levels across locations</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-800 text-dark-400 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 overflow-y-auto">
          
          {/* Step 1: Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-dark-500 uppercase tracking-widest ml-1">
                <Package className="w-3 h-3" /> Target Product
              </label>
              <select {...register('productId')} className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-medium appearance-none">
                <option value="">Choose product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                ))}
              </select>
              {errors.productId && <p className="text-rose-400 text-[10px] font-bold mt-1 ml-1">{errors.productId.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-dark-500 uppercase tracking-widest ml-1">
                <MapPin className="w-3 h-3" /> Location
              </label>
              <select {...register('locationId')} className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-medium appearance-none">
                <option value="">Select location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                ))}
              </select>
              {errors.locationId && <p className="text-rose-400 text-[10px] font-bold mt-1 ml-1">{errors.locationId.message}</p>}
            </div>
          </div>

          {/* Step 2: Transaction Details */}
          <div className="space-y-6 bg-dark-800/40 p-6 rounded-2xl border border-dark-700/50">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-gold-500" />
              <h3 className="text-[10px] font-black text-dark-400 uppercase tracking-widest">Transaction Details</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest mb-2 block ml-1">Movement Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { val: 'PURCHASE', label: 'Purchase' },
                    { val: 'SALE', label: 'Sale' },
                    { val: 'OPENING', label: 'Opening' },
                    { val: 'RETURN', label: 'Return' },
                    { val: 'ADJUSTMENT', label: 'Adjustment' },
                  ].map(t => (
                    <label key={t.val} className={`
                      flex items-center justify-center px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all
                      ${selectedType === t.val 
                        ? 'bg-gold-500/10 border-gold-500 text-gold-500 shadow-lg shadow-gold-500/5' 
                        : 'bg-dark-900 border-dark-700 text-dark-500 hover:border-dark-600'
                      }
                    `}>
                      <input type="radio" value={t.val} {...register('type')} className="hidden" />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest mb-2 block ml-1">Quantity</label>
                  <input 
                    type="number" 
                    {...register('quantityDelta', { valueAsNumber: true })} 
                    className={`w-full bg-dark-900 border border-dark-700 px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-mono font-black
                      ${selectedType === 'SALE' ? 'text-rose-400' : 'text-emerald-400'}
                    `} 
                    placeholder="e.g. 1" 
                  />
                  <div className="mt-2 flex items-center gap-1 text-[9px] text-dark-500 italic">
                    <Info className="w-3 h-3" />
                    {selectedType === 'SALE' ? 'Reduces stock from location' : 'Adds stock to location'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest mb-2 block ml-1">Weight (g)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    {...register('weightDelta', { valueAsNumber: true })} 
                    className="w-full bg-dark-900 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-mono font-bold" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest mb-2 block ml-1">Notes / Reference</label>
                <input 
                  {...register('notes')} 
                  className="w-full bg-dark-900 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all text-sm" 
                  placeholder="e.g. Invoice #9921, Customer Return..." 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-dark-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-8 py-4 rounded-2xl text-dark-400 hover:text-white hover:bg-dark-800 transition-all font-bold"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-gold-600 hover:bg-gold-500 text-dark-950 px-10 py-4 rounded-2xl font-black transition-all shadow-lg shadow-gold-600/20 disabled:opacity-50 flex items-center gap-3"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isSubmitting ? 'Processing...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
