import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, Printer, RefreshCcw, Search, Filter, X,
  ChevronLeft, ChevronRight, FileSpreadsheet, FileBarChart2,
  Eye, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { invoiceListService, PostedInvoice } from '../../services/invoiceListService';
import { invoiceService } from '../../services/invoiceService';

const statusColors: Record<string, string> = {
  POSTED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  REVERSED: 'text-red-400 bg-red-400/10 border-red-400/20',
  DRAFT: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  PARTIAL: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

const typeColors: Record<string, string> = {
  SALE: 'text-gold-400 bg-gold-400/10 border-gold-400/20',
  PURCHASE: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  ESTIMATE: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
};

const typeIcons: Record<string, React.ReactNode> = {
  SALE: <ArrowUpRight className="w-3 h-3" />,
  PURCHASE: <ArrowDownLeft className="w-3 h-3" />,
  ESTIMATE: <FileText className="w-3 h-3" />,
};

function formatCurrency(val: number | string) {
  return `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PostedInvoicesPage() {
  const [invoices, setInvoices] = useState<PostedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [reversing, setReversing] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceListService.listPosted({
        type: typeFilter || undefined,
        start: startDate || undefined,
        end: endDate || undefined,
        page,
        limit: 20,
      });
      setInvoices(res.data || []);
      setPagination({ total: res.pagination.total, pages: res.pagination.pages });
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, startDate, endDate, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleReverse = async (inv: PostedInvoice) => {
    if (!confirm(`Reverse invoice ${inv.invoiceNumber}? This cannot be undone.`)) return;
    setReversing(inv.id);
    try {
      await invoiceService.reverseInvoice(inv.id);
      toast.success(`Invoice ${inv.invoiceNumber} reversed.`);
      fetchInvoices();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Reversal failed');
    } finally {
      setReversing(null);
    }
  };

  const handleDownloadPDF = (id: string) => {
    invoiceListService.downloadPDF(id);
    toast.info('Opening PDF...');
  };

  const handleThermalPrint = (id: string) => {
    window.open(`/dashboard/invoices/${id}/thermal`, '_blank', 'width=400,height=700');
  };

  const filteredInvoices = search
    ? invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer.name.toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

  const clearFilters = () => {
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const hasFilters = typeFilter || startDate || endDate || search;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoice Register</h1>
          <p className="text-dark-400 text-sm mt-1">
            {pagination.total} posted invoice{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => invoiceListService.downloadCSV({
              start: startDate || undefined,
              end: endDate || undefined,
            } as any)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-dark-700 text-dark-300 hover:border-gold-500/50 hover:text-gold-400 transition-all"
          >
            <FileBarChart2 className="w-4 h-4" />
            CSV Export
          </button>
          <button
            onClick={() => invoiceListService.downloadExcel('trial-balance')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-dark-700 text-dark-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Trial Balance XLS
          </button>
          <button
            onClick={() => invoiceListService.downloadExcel('daybook')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-dark-700 text-dark-300 hover:border-blue-500/50 hover:text-blue-400 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Day Book XLS
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice # or customer..."
              className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-gold-500/50"
          >
            <option value="">All Types</option>
            <option value="SALE">Sale</option>
            <option value="PURCHASE">Purchase</option>
            <option value="ESTIMATE">Estimate</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-gold-500/50"
          />
          <span className="text-dark-500 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-gold-500/50"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}

          <button
            onClick={fetchInvoices}
            className="p-2 rounded-lg border border-dark-700 text-dark-400 hover:text-white hover:border-dark-600 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No invoices found</p>
            <p className="text-dark-600 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-800">
                {['Invoice #', 'Date', 'Customer', 'Type', 'Status', 'Grand Total', 'Payment', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gold-400 font-semibold">
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-300">{formatDate(inv.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{inv.customer.name}</div>
                    {inv.customer.phone && (
                      <div className="text-xs text-dark-500">{inv.customer.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${typeColors[inv.type] || 'text-dark-400 bg-dark-800'}`}>
                      {typeIcons[inv.type]}
                      {inv.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[inv.status] || 'text-dark-400 bg-dark-800'}`}>
                      {inv.status === 'POSTED' && <CheckCircle2 className="w-3 h-3" />}
                      {inv.status === 'REVERSED' && <AlertCircle className="w-3 h-3" />}
                      {inv.status === 'DRAFT' && <Clock className="w-3 h-3" />}
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white">{formatCurrency(inv.grandTotal)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-dark-400 space-y-0.5">
                      {inv.payments.map((p, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-dark-300">{p.mode}</span>
                          <span className="text-gold-500">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                      {inv.payments.length === 0 && <span className="text-dark-600">No payments</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* PDF */}
                      <button
                        onClick={() => handleDownloadPDF(inv.id)}
                        title="Download PDF"
                        className="p-1.5 rounded-lg hover:bg-gold-500/10 text-dark-400 hover:text-gold-400 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {/* Thermal */}
                      <button
                        onClick={() => handleThermalPrint(inv.id)}
                        title="Thermal Print"
                        className="p-1.5 rounded-lg hover:bg-blue-500/10 text-dark-400 hover:text-blue-400 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {/* Reverse */}
                      {inv.status === 'POSTED' && (
                        <button
                          onClick={() => handleReverse(inv)}
                          disabled={reversing === inv.id}
                          title="Reverse Invoice"
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-all disabled:opacity-50"
                        >
                          {reversing === inv.id ? (
                            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCcw className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-800">
            <span className="text-xs text-dark-500">
              Page {page} of {pagination.pages} · {pagination.total} total
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-dark-700 text-dark-400 hover:text-white hover:border-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-dark-700 text-dark-400 hover:text-white hover:border-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
