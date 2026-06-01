import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Printer, Save, CheckCircle2, AlertCircle, ScanBarcode, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { invoiceService } from '../../services/invoiceService';
import { customerService, Customer } from '../../services/customerService';
import { inventoryService, Product } from '../../services/inventoryService';

interface LineItem {
  productId: string;
  lotId?: string;
  quantity: number;
  weight: number;
  rate: number;
  purity: number;
  makingCharge: number;
  wastage: number;
  hsn?: string;
  discountPercent: number;
  gstPercent: number;
  amount: number;
}

export default function CreateInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form State
  const [type, setType] = useState<'SALE' | 'PURCHASE'>('SALE');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT'>('CASH');
  const [referenceId, setReferenceId] = useState('');

  // Lookup & UI States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodData = await inventoryService.getProducts();
        setProducts(prodData.data || []);
      } catch (err) {
        toast.error('Failed to load products');
      }
    };
    fetchData();
  }, []);

  // Handle Edit Mode Load
  useEffect(() => {
    if (isEditMode) {
      const loadDraft = async () => {
        try {
          const res = await invoiceService.getDrafts();
          const drafts = res.data || [];
          const draft = drafts.find((d: any) => d.id === id);
          if (draft) {
            setType(draft.type);
            setSelectedCustomer(draft.customer);
            setNotes(draft.notes || '');
            setDiscount(Number(draft.discount));
            
            const mappedItems = draft.items.map((item: any) => ({
              productId: item.productId,
              lotId: item.lotId,
              quantity: item.quantity,
              weight: Number(item.weight),
              rate: Number(item.rate),
              purity: Number(item.purity),
              makingCharge: Number(item.makingCharge),
              wastage: Number(item.wastage),
              hsn: item.hsn,
              discountPercent: Number(item.discountPercent),
              gstPercent: Number(item.gstPercent),
              amount: Number(item.amount),
            }));
            setItems(mappedItems);
          } else {
            toast.error('Draft not found');
            navigate('/dashboard/invoices/drafts');
          }
        } catch (err) {
          toast.error('Failed to load draft details');
        }
      };
      loadDraft();
    }
  }, [id, isEditMode]);

  // Customer Search
  useEffect(() => {
    if (customerSearch.trim().length > 1) {
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await customerService.searchCustomers(customerSearch);
          setCustomers(res.data || []);
        } catch (err) {
          console.error(err);
        }
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  // Calculations
  const subTotal = items.reduce((sum, item) => {
    const itemSub = (item.weight * item.rate) + item.makingCharge;
    return sum + itemSub;
  }, 0);

  const taxTotal = items.reduce((sum, item) => {
    const itemSub = (item.weight * item.rate) + item.makingCharge;
    const itemDisc = itemSub * (item.discountPercent / 100);
    const taxable = itemSub - itemDisc;
    return sum + (taxable * (item.gstPercent / 100));
  }, 0);

  const grandTotal = Math.max(0, subTotal + taxTotal - discount);

  // Add Item Line
  const addLineItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        quantity: 1,
        weight: 0,
        rate: 0,
        purity: 0.916,
        makingCharge: 0,
        wastage: 0,
        discountPercent: 0,
        gstPercent: 3,
        amount: 0,
      },
    ]);
  };

  // Remove Item Line
  const removeLineItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // Handle Field Changes
  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // Auto-calculate item amount
    const itemSub = (item.weight * item.rate) + item.makingCharge;
    const itemDisc = itemSub * (item.discountPercent / 100);
    const taxable = itemSub - itemDisc;
    const itemTax = taxable * (item.gstPercent / 100);
    item.amount = Math.max(0, taxable + itemTax);

    updated[index] = item;
    setItems(updated);
  };

  // Handle Product Select
  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const lot = prod.lots?.[0]; // Default to first available lot if present

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      lotId: lot?.id || undefined,
      weight: lot ? Number(lot.weight) : Number(prod.grossWeight),
      rate: 7000, // Market gold rate default
      purity: Number(prod.purity),
      makingCharge: Number(prod.makingCharge),
      wastage: Number(prod.wastagePercent),
      gstPercent: 3,
    };

    // Calculate initial amount
    const itemSub = (updated[index].weight * updated[index].rate) + updated[index].makingCharge;
    updated[index].amount = itemSub + (itemSub * (updated[index].gstPercent / 100));

    setItems(updated);
  };

  // Scan Barcode
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;

    // Search for a matching lot barcode in all products
    let foundLot: any = null;
    let foundProduct: Product | null = null;

    for (const prod of products) {
      const lot = prod.lots?.find((l: any) => l.id === barcodeQuery || String(l.id).startsWith(barcodeQuery));
      if (lot) {
        foundLot = lot;
        foundProduct = prod;
        break;
      }
    }

    if (foundLot && foundProduct) {
      const newItem: LineItem = {
        productId: foundProduct.id,
        lotId: foundLot.id,
        quantity: 1,
        weight: Number(foundLot.weight),
        rate: 7000,
        purity: Number(foundProduct.purity),
        makingCharge: Number(foundProduct.makingCharge),
        wastage: Number(foundProduct.wastagePercent),
        discountPercent: 0,
        gstPercent: 3,
        amount: 0,
      };

      const itemSub = (newItem.weight * newItem.rate) + newItem.makingCharge;
      newItem.amount = itemSub + (itemSub * (newItem.gstPercent / 100));

      setItems([...items, newItem]);
      toast.success(`Scanned and added: ${foundProduct.name} (${foundLot.barcode || 'Lot'})`);
      setBarcodeQuery('');
    } else {
      toast.error('No inventory lot found matching this barcode/RFID');
    }
  };

  // Add Customer Inline
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error('Customer name and phone are required');
      return;
    }

    try {
      const res = await customerService.createCustomer(newCustomer);
      setSelectedCustomer(res.data);
      setShowNewCustomerModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      toast.success('Customer created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        customerId: selectedCustomer.id,
        notes,
        items,
        subTotal,
        taxTotal,
        discount,
        grandTotal,
      };

      if (isEditMode) {
        await invoiceService.editDraft(id!, payload);
        toast.success('Draft invoice updated successfully');
      } else {
        await invoiceService.saveDraft(payload);
        toast.success('Draft invoice saved successfully');
      }
      navigate('/dashboard/invoices/drafts');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Post Invoice
  const handlePostInvoice = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const payments = [{ amount: grandTotal, mode: paymentMode, referenceId: referenceId || undefined }];
      const payload = {
        type,
        customerId: selectedCustomer.id,
        notes,
        items,
        payments,
        subTotal,
        taxTotal,
        discount,
        grandTotal,
      };

      if (isEditMode) {
        await invoiceService.postDraft(id!, payments);
        toast.success('Draft invoice posted atomically!');
      } else {
        await invoiceService.postInvoice(payload);
        toast.success('Invoice posted atomically successfully!');
      }
      navigate('/dashboard/inventory/ledger');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to post invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEditMode && (
            <button onClick={() => navigate('/dashboard/invoices/drafts')} className="p-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-white rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {isEditMode ? 'Edit Draft Invoice' : 'New Invoice'}
            </h1>
            <p className="text-dark-400 mt-1">
              {isEditMode ? 'Modify and finalize your draft.' : 'Create an immutable sales or purchase entry.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700 transition-all border border-dark-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isEditMode ? 'Update Draft' : 'Save Draft'}
          </button>
          <button 
            onClick={handlePostInvoice}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-dark-950 bg-gradient-to-r from-gold-500 to-gold-400 hover:to-gold-300 transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isEditMode ? 'Post Draft' : 'Post Invoice'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Customer & Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Invoice Type Select */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Invoice Type</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setType('SALE')}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${type === 'SALE' ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-dark-950 border-dark-800 text-dark-400 hover:text-white'}`}
              >
                Sales Invoice (Outward)
              </button>
              <button 
                onClick={() => setType('PURCHASE')}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${type === 'PURCHASE' ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-dark-950 border-dark-800 text-dark-400 hover:text-white'}`}
              >
                Purchase Voucher (Inward)
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-gold-500" />
              Customer Details
            </h2>

            {selectedCustomer ? (
              <div className="flex justify-between items-center bg-dark-950 border border-dark-800 p-4 rounded-xl">
                <div>
                  <p className="text-white font-bold">{selectedCustomer.name}</p>
                  <p className="text-dark-400 text-xs mt-1">{selectedCustomer.phone} | {selectedCustomer.email || 'No Email'}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-xs text-rose-400 hover:text-rose-300 font-bold">
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input 
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customer by name or phone (e.g. Test)..."
                    className="flex-1 bg-dark-950 border border-dark-800 rounded-xl px-4 py-3 text-sm text-white focus:border-gold-500/50 outline-none transition-all"
                  />
                  <button onClick={() => setShowNewCustomerModal(true)} className="px-4 py-3 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New
                  </button>
                </div>

                {customers.length > 0 && (
                  <div className="bg-dark-950 border border-dark-800 rounded-xl divide-y divide-dark-800 overflow-hidden">
                    {customers.map((c) => (
                      <div 
                        key={c.id} 
                        onClick={() => { setSelectedCustomer(c); setCustomers([]); setCustomerSearch(''); }}
                        className="p-3 hover:bg-dark-800/40 cursor-pointer transition-all flex justify-between items-center text-sm"
                      >
                        <span className="text-white font-medium">{c.name}</span>
                        <span className="text-dark-400 text-xs">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Barcode Scanner Box */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ScanBarcode className="w-4 h-4 text-gold-500" />
              Barcode/RFID Scan Simulator
            </h2>
            <form onSubmit={handleBarcodeScan} className="flex gap-4">
              <input 
                type="text"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                placeholder="Enter or scan barcode/RFID (e.g. BARCODE-1)..."
                className="flex-1 bg-dark-950 border border-dark-800 rounded-xl px-4 py-3 text-sm text-white focus:border-gold-500/50 outline-none transition-all"
              />
              <button type="submit" className="px-5 py-3 bg-gold-500 hover:bg-gold-400 text-dark-950 rounded-xl text-sm font-bold transition-all">
                Scan Item
              </button>
            </form>
          </div>

          {/* Item Grid */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Item Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-dark-950/50 text-dark-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-medium w-48">Product</th>
                    <th className="px-4 py-3 font-medium">Lot ID (Optional)</th>
                    <th className="px-4 py-3 font-medium">Wt (g)</th>
                    <th className="px-4 py-3 font-medium">Rate/g</th>
                    <th className="px-4 py-3 font-medium">Making (₹)</th>
                    <th className="px-4 py-3 font-medium">Disc %</th>
                    <th className="px-4 py-3 font-medium">GST %</th>
                    <th className="px-4 py-3 font-medium text-right w-36">Amount (₹)</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-dark-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <select 
                          value={item.productId} 
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2 text-white text-xs outline-none"
                        >
                          <option value="">Select Product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          placeholder="Lot ID"
                          value={item.lotId || ''} 
                          onChange={(e) => handleItemChange(idx, 'lotId', e.target.value)}
                          className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2 text-white text-xs outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          step="0.001"
                          placeholder="0.000"
                          value={item.weight || ''} 
                          onChange={(e) => handleItemChange(idx, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-dark-950 border border-dark-800 rounded-lg p-2 text-white text-xs outline-none text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          placeholder="Rate"
                          value={item.rate || ''} 
                          onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-dark-950 border border-dark-800 rounded-lg p-2 text-white text-xs outline-none text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          placeholder="Making"
                          value={item.makingCharge || ''} 
                          onChange={(e) => handleItemChange(idx, 'makingCharge', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-dark-950 border border-dark-800 rounded-lg p-2 text-white text-xs outline-none text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          max="100"
                          placeholder="Discount %"
                          value={item.discountPercent || ''} 
                          onChange={(e) => handleItemChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-dark-950 border border-dark-800 rounded-lg p-2 text-white text-xs outline-none text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          max="100"
                          placeholder="GST"
                          value={item.gstPercent || ''} 
                          onChange={(e) => handleItemChange(idx, 'gstPercent', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-dark-950 border border-dark-800 rounded-lg p-2 text-white text-xs outline-none text-right"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeLineItem(idx)} className="text-dark-500 hover:text-rose-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-dark-950/30">
              <button onClick={addLineItem} className="text-sm font-bold text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Notes & Observations</h2>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add memo or transaction terms..."
              rows={3}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-sm text-white focus:border-gold-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Column: Totals & Payments */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/5 rounded-full blur-3xl" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Subtotal</span>
                <span className="text-white font-medium">₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Total Tax (GST)</span>
                <span className="text-white font-medium">₹{taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Discount Discount (₹)</span>
                <input 
                  type="number" 
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-dark-950 border border-dark-800 rounded-lg p-1.5 text-white text-xs outline-none text-right font-medium focus:border-gold-500/50"
                  placeholder="0.00"
                />
              </div>
              
              <div className="pt-4 border-t border-dark-800">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-dark-300 uppercase tracking-widest font-bold">Grand Total</span>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-200">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
             <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Payment Method</h2>
             <div className="grid grid-cols-2 gap-3 mb-4">
                {(['CASH', 'UPI', 'CARD', 'CREDIT'] as const).map(mode => (
                  <button 
                    key={mode} 
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-all text-center ${paymentMode === mode ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-dark-950 border-dark-700 text-dark-300 hover:text-white hover:border-dark-600'}`}
                  >
                    {mode}
                  </button>
                ))}
             </div>
             
             {paymentMode !== 'CASH' && paymentMode !== 'CREDIT' && (
               <input 
                 type="text" 
                 placeholder="Reference (UTR / Transaction ID)"
                 value={referenceId}
                 onChange={(e) => setReferenceId(e.target.value)}
                 className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 mb-4 text-xs text-white focus:border-gold-500/50 outline-none transition-all"
               />
             )}

             <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed">
               <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
               <p>Posting this invoice will atomically lock inventory and commit records to the stock movement ledger.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Customer Create Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl max-w-md w-full p-6 animate-scale-up">
            <h3 className="text-lg font-bold text-white mb-4">Create New Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="text-xs text-dark-400 font-bold block mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-gold-500/50"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 font-bold block mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-gold-500/50"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 font-bold block mb-1">Email (Optional)</label>
                <input 
                  type="email" 
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-gold-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 font-bold block mb-1">Address (Optional)</label>
                <textarea 
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-gold-500/50"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowNewCustomerModal(false)} className="px-4 py-2 border border-dark-700 text-dark-300 hover:text-white rounded-lg text-sm transition-all">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-dark-950 font-bold rounded-lg text-sm transition-all">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
