import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Loader2, Trash2, Edit2, Globe, Warehouse, Store, Building2, ChevronRight, MoreHorizontal } from 'lucide-react';
import { locationService, InventoryLocation } from '../../services/locationService';
import { toast } from 'sonner';

const LocationPage: React.FC = () => {
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLocation, setNewLocation] = useState<{ name: string; type: 'WAREHOUSE' | 'STORE' | 'SUPPLIER' | 'CUSTOMER' }>({ name: '', type: 'WAREHOUSE' });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await locationService.getLocations();
      setLocations(res.data);
    } catch (error) {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await locationService.createLocation(newLocation);
      toast.success('Location added successfully');
      setIsAddModalOpen(false);
      setNewLocation({ name: '', type: 'WAREHOUSE' });
      fetchLocations();
    } catch (error) {
      toast.error('Failed to add location');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this location?')) return;
    try {
      await locationService.deleteLocation(id);
      toast.success('Location deactivated');
      fetchLocations();
    } catch (error) {
      toast.error('Failed to delete location');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'WAREHOUSE': return Warehouse;
      case 'STORE': return Store;
      case 'SUPPLIER': return Building2;
      default: return MapPin;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <MapPin className="w-8 h-8 text-gold-500" />
            Locations
          </h1>
          <p className="text-dark-400 text-sm mt-1">Manage warehouses, showrooms, and logistics points</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-dark-950 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-gold-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gold-500 mb-4" />
            <p className="text-dark-400 font-medium">Locating storage units...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="col-span-full card p-20 text-center border-dashed border-dark-700 bg-transparent">
            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-10 h-10 text-dark-600" />
            </div>
            <h3 className="text-xl font-bold text-white">No active locations</h3>
            <p className="text-dark-500 mt-2 max-w-xs mx-auto">Add your first warehouse or showroom to start managing stock across points.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-6 text-gold-500 font-bold hover:text-gold-400 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create your first point
            </button>
          </div>
        ) : (
          locations.map((loc) => {
            const IconComp = getIcon(loc.type);
            return (
              <div key={loc.id} className="glass p-6 rounded-2xl border border-dark-800 hover:border-gold-500/30 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${
                    loc.type === 'WAREHOUSE' ? 'bg-blue-500/10 text-blue-400' :
                    loc.type === 'STORE' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(loc.id)} 
                      className="p-2 hover:bg-rose-500/10 rounded-lg text-dark-400 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">{loc.name}</h3>
                    {loc.isActive !== false && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active" />
                    )}
                  </div>
                  <p className="text-dark-500 text-[10px] font-black uppercase tracking-widest">{loc.type}</p>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-dark-900 bg-dark-800 flex items-center justify-center text-[8px] font-bold text-dark-500">
                        U{i}
                      </div>
                    ))}
                  </div>
                  <button className="flex items-center gap-1 text-[10px] font-black text-gold-500 hover:text-gold-400 uppercase tracking-widest">
                    Manage Stock
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Location Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-8 border-b border-dark-800">
              <h2 className="text-2xl font-black text-white tracking-tight">New Location</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-800 text-dark-400 hover:text-white transition-all">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddLocation} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest">Location Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-medium" 
                  placeholder="e.g. Main Showroom, Central Vault"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest">Type</label>
                <select 
                  className="w-full bg-dark-800 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-medium appearance-none"
                  value={newLocation.type}
                  onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as 'WAREHOUSE' | 'STORE' | 'SUPPLIER' | 'CUSTOMER' })}
                >
                  <option value="WAREHOUSE">Warehouse / Vault</option>
                  <option value="STORE">Showroom / Store</option>
                  <option value="SUPPLIER">Partner / Supplier Point</option>
                  <option value="CUSTOMER">Customer Holding</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="flex-1 px-6 py-4 rounded-2xl text-dark-400 hover:text-white hover:bg-dark-800 transition-all font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-gold-600 hover:bg-gold-500 text-dark-950 px-6 py-4 rounded-2xl font-black transition-all shadow-lg shadow-gold-600/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPage;
