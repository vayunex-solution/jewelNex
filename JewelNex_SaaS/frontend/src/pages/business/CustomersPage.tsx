import React, { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Search, Mail, Phone, MapPin, ClipboardList, CheckCircle2, ShieldAlert } from 'lucide-react';
import { customerService, Customer } from '../../services/customerService';
import { toast } from 'sonner';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    gstNumber: '',
    panNumber: '',
    address: '',
  });

  const fetchCustomers = async (query = '') => {
    try {
      setLoading(true);
      const res = await customerService.searchCustomers(query);
      setCustomers(res.data || []);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(searchQuery);
  }, [searchQuery]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!newCustomer.name?.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await customerService.createCustomer(newCustomer);
      toast.success('Customer registered successfully');
      setIsAddModalOpen(false);
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        gstNumber: '',
        panNumber: '',
        address: '',
      });
      fetchCustomers(searchQuery);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add customer. Ensure phone number is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark-50 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-gold-500" />
            Customers
          </h1>
          <p className="text-dark-400 text-sm mt-1">Manage and register customer profiles and ledger references</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-dark-950 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-gold-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-dark-800 p-4 rounded-2xl border border-dark-700">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search customers by name or contact number..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-gold-500/50 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Customers List */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden shadow-lg shadow-black/5">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gold-500 mb-4" />
            <p className="text-dark-400 font-medium">Retrieving client logs...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-dark-600" />
            </div>
            <h3 className="text-xl font-bold text-dark-50">No customers found</h3>
            <p className="text-dark-500 mt-2 max-w-xs mx-auto">Try refining your search query or register a new customer in the system.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-6 text-gold-500 font-bold hover:text-gold-400 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Register first client
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-dark-700 bg-dark-900/50 text-[10px] uppercase tracking-wider font-bold text-dark-400">
                  <th className="px-6 py-4">Client Identity</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Government IDs</th>
                  <th className="px-6 py-4">Billing Address</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50 text-sm">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-dark-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gold-600/10 flex items-center justify-center text-gold-500 font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-dark-50">{customer.name}</p>
                          <p className="text-[10px] font-mono text-dark-400 mt-0.5">{customer.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {customer.phone && (
                        <p className="flex items-center gap-1.5 text-xs text-dark-100">
                          <Phone className="w-3.5 h-3.5 text-dark-300" />
                          {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="flex items-center gap-1.5 text-xs text-dark-200">
                          <Mail className="w-3.5 h-3.5 text-dark-300" />
                          {customer.email}
                        </p>
                      )}
                      {!customer.phone && !customer.email && <p className="text-xs text-dark-400 italic">No contacts added</p>}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {customer.gstNumber && (
                        <p className="text-xs font-mono text-dark-100">
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-dark-900 border border-dark-700 px-1.5 py-0.5 rounded mr-1.5 text-dark-300">GST</span>
                          {customer.gstNumber}
                        </p>
                      )}
                      {customer.panNumber && (
                        <p className="text-xs font-mono text-dark-100">
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-dark-900 border border-dark-700 px-1.5 py-0.5 rounded mr-1.5 text-dark-300">PAN</span>
                          {customer.panNumber}
                        </p>
                      )}
                      {!customer.gstNumber && !customer.panNumber && <p className="text-xs text-dark-400 italic">No government identifiers</p>}
                    </td>
                    <td className="px-6 py-4">
                      {customer.address ? (
                        <p className="text-xs text-dark-200 max-w-xs truncate" title={customer.address}>
                          <MapPin className="w-3.5 h-3.5 inline mr-1 text-dark-300" />
                          {customer.address}
                        </p>
                      ) : (
                        <p className="text-xs text-dark-400 italic">No address provided</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-dark-800 border border-dark-700 rounded-3xl p-6 shadow-2xl animate-slide-up z-10">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dark-700">
              <div className="w-10 h-10 bg-gold-600/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-dark-50">Register New Customer</h3>
                <p className="text-xs text-dark-400 mt-0.5">Add client profile details to generate sales bills</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="form-label text-xs uppercase tracking-wider font-bold">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Palak Shah"
                  className="input-field"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs uppercase tracking-wider font-bold">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    className="input-field"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs uppercase tracking-wider font-bold">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. client@example.com"
                    className="input-field"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs uppercase tracking-wider font-bold">GST Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="input-field"
                    value={newCustomer.gstNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, gstNumber: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs uppercase tracking-wider font-bold">PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    className="input-field"
                    value={newCustomer.panNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, panNumber: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-xs uppercase tracking-wider font-bold">Billing Address</label>
                <textarea
                  rows={3}
                  placeholder="Enter complete postal address..."
                  className="input-field resize-none"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-dark-700 text-dark-300 hover:bg-dark-900 text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary py-3"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                  ) : (
                    'Register Client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
