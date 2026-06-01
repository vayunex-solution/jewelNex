import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, MapPin, Phone, Mail, Globe, Shield,
  Image as ImageIcon, Save, RefreshCcw, Eye, X, CheckCircle2,
  Gem, FileText, Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsService, CompanySettings } from '../../services/settingsService';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh',
  'Dadra & Nagar Haveli', 'Daman & Diu', 'Lakshadweep', 'Puducherry',
];

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  hint?: string;
  textarea?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, placeholder, icon, hint, textarea }) => (
  <div>
    <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1.5">{label}</label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">
          {icon}
        </span>
      )}
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-600 focus:outline-none focus:border-gold-500/50 resize-none`}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-600 focus:outline-none focus:border-gold-500/50`}
        />
      )}
    </div>
    {hint && <p className="text-xs text-dark-600 mt-1">{hint}</p>}
  </div>
);

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<Partial<CompanySettings>>({
    name: '',
    tagline: '',
    gstin: '',
    panNumber: '',
    address: '',
    city: '',
    state: 'Gujarat',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    logoBase64: '',
    gstType: 'CGST_SGST',
    currencySymbol: '₹',
    invoicePrefix: '',
    invoiceFooter: 'Thank you for your business!',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    settingsService.getCompanySettings()
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load settings');
        setLoading(false);
      });
  }, []);

  const set = (key: keyof CompanySettings) => (val: string) =>
    setSettings(prev => ({ ...prev, [key]: val }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error('Logo must be under 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setSettings(prev => ({ ...prev, logoBase64: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateCompanySettings(settings);
      toast.success('Company settings saved!');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Settings</h1>
          <p className="text-dark-400 text-sm mt-1">Configure your business profile for invoices and receipts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dark-700 text-dark-300 hover:border-gold-500/50 hover:text-gold-400 transition-all text-sm"
          >
            <Eye className="w-4 h-4" /> Preview Header
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 text-dark-950 font-semibold text-sm hover:from-gold-500 hover:to-gold-400 transition-all disabled:opacity-60"
          >
            {saving ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Identity */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gold-400" /> Business Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Business / Shop Name *"
                value={settings.name || ''}
                onChange={set('name')}
                placeholder="e.g. Lalitha Gold Works"
                icon={<Gem className="w-4 h-4" />}
              />
              <InputField
                label="Tagline"
                value={settings.tagline || ''}
                onChange={set('tagline')}
                placeholder="e.g. Fine Jewellery Since 1989"
              />
              <InputField
                label="GSTIN"
                value={settings.gstin || ''}
                onChange={set('gstin')}
                placeholder="e.g. 24AAACP1234F1Z5"
                hint="15-digit GST Identification Number"
                icon={<Shield className="w-4 h-4" />}
              />
              <InputField
                label="PAN Number"
                value={settings.panNumber || ''}
                onChange={set('panNumber')}
                placeholder="e.g. AAACP1234F"
              />
            </div>
          </div>

          {/* Address */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold-400" /> Address
            </h2>
            <InputField
              label="Street Address"
              value={settings.address || ''}
              onChange={set('address')}
              placeholder="Shop No. 12, Main Market Road"
              textarea
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="City" value={settings.city || ''} onChange={set('city')} placeholder="Surat" />
              <div>
                <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1.5">State</label>
                <select
                  value={settings.state || 'Gujarat'}
                  onChange={e => set('state')(e.target.value)}
                  className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-gold-500/50"
                >
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <InputField label="Pincode" value={settings.pincode || ''} onChange={set('pincode')} placeholder="395001" />
            </div>
          </div>

          {/* Contact */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-gold-400" /> Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Phone" value={settings.phone || ''} onChange={set('phone')} placeholder="+91 98765 43210" icon={<Phone className="w-4 h-4" />} />
              <InputField label="Email" value={settings.email || ''} onChange={set('email')} placeholder="info@yourshop.com" icon={<Mail className="w-4 h-4" />} />
              <InputField label="Website" value={settings.website || ''} onChange={set('website')} placeholder="www.yourshop.com" icon={<Globe className="w-4 h-4" />} />
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold-400" /> Invoice Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1.5">GST Type</label>
                <select
                  value={settings.gstType || 'CGST_SGST'}
                  onChange={e => set('gstType')(e.target.value)}
                  className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-gold-500/50"
                >
                  <option value="CGST_SGST">CGST + SGST (Intra-State)</option>
                  <option value="IGST">IGST (Inter-State)</option>
                </select>
              </div>
              <InputField
                label="Currency Symbol"
                value={settings.currencySymbol || '₹'}
                onChange={set('currencySymbol')}
                placeholder="₹"
                hint="Shown on all invoices and reports"
              />
              <InputField
                label="Invoice Footer Message"
                value={settings.invoiceFooter || ''}
                onChange={set('invoiceFooter')}
                placeholder="Thank you for your business!"
                textarea
              />
            </div>
          </div>
        </div>

        {/* Right column — Logo upload + preview */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gold-400" /> Business Logo
            </h2>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-dark-700 rounded-xl p-6 text-center cursor-pointer hover:border-gold-500/40 transition-colors"
            >
              {settings.logoBase64 ? (
                <img src={settings.logoBase64} alt="logo" className="max-h-24 mx-auto object-contain" />
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-dark-600 mx-auto mb-2" />
                  <p className="text-dark-400 text-sm">Click to upload logo</p>
                  <p className="text-dark-600 text-xs mt-1">PNG, JPG · Max 500KB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            {settings.logoBase64 && (
              <button
                onClick={() => setSettings(prev => ({ ...prev, logoBase64: '' }))}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-400/20 text-red-400 text-sm hover:bg-red-400/10 transition-all"
              >
                <X className="w-3 h-3" /> Remove Logo
              </button>
            )}
          </div>

          {/* Quick Preview Card */}
          <div className="glass-card rounded-xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gold-400" /> Invoice Preview
            </h2>
            <div className="bg-dark-900 rounded-lg p-4 border border-dark-700 text-sm space-y-1">
              <div className="font-bold text-gold-400 text-base">{settings.name || 'Your Shop Name'}</div>
              {settings.tagline && <div className="text-dark-400 text-xs">{settings.tagline}</div>}
              {settings.gstin && <div className="text-dark-400 text-xs">GSTIN: {settings.gstin}</div>}
              {settings.address && <div className="text-dark-500 text-xs">{settings.address}</div>}
              {settings.city && (
                <div className="text-dark-500 text-xs">{[settings.city, settings.state, settings.pincode].filter(Boolean).join(', ')}</div>
              )}
              {settings.phone && <div className="text-dark-500 text-xs">📞 {settings.phone}</div>}
              <div className="border-t border-dark-700 pt-2 mt-2 text-xs text-dark-600">
                GST Mode: {settings.gstType === 'IGST' ? 'IGST' : 'CGST + SGST'} · {settings.currencySymbol}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
