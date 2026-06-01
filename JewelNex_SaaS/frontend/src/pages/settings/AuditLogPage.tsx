import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Filter, RefreshCcw, Search, ChevronLeft, ChevronRight,
  User, Package, FileText, BarChart3, Settings, Shield,
  ChevronDown, ChevronRight as ChevronRightIcon, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { name: string; email: string };
}

const entityIcons: Record<string, React.ReactNode> = {
  invoice: <FileText className="w-3.5 h-3.5" />,
  product: <Package className="w-3.5 h-3.5" />,
  customer: <User className="w-3.5 h-3.5" />,
  user: <Shield className="w-3.5 h-3.5" />,
  settings: <Settings className="w-3.5 h-3.5" />,
  accounting: <BarChart3 className="w-3.5 h-3.5" />,
};

const actionColors: Record<string, string> = {
  CREATE: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  UPDATE: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  DELETE: 'text-red-400 bg-red-400/10 border-red-400/20',
  LOGIN: 'text-gold-400 bg-gold-400/10 border-gold-400/20',
  LOGOUT: 'text-dark-400 bg-dark-800 border-dark-700',
  POST: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  REVERSE: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  EXPORT: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function JsonDiffViewer({ old: oldVal, neww }: { old?: any; neww?: any }) {
  const renderJson = (val: any) => {
    if (!val) return <span className="text-dark-600">—</span>;
    try {
      return (
        <pre className="text-xs text-dark-300 overflow-auto max-h-48 p-3 bg-dark-950 rounded-lg border border-dark-700 whitespace-pre-wrap">
          {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-dark-600 text-xs">(unrenderable)</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      <div>
        <div className="text-xs font-semibold text-red-400 mb-1">Before</div>
        {renderJson(oldVal)}
      </div>
      <div>
        <div className="text-xs font-semibold text-emerald-400 mb-1">After</div>
        {renderJson(neww)}
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: {
          page, limit: 25,
          entity: entityFilter || undefined,
          action: actionFilter || undefined,
          start: startDate || undefined,
          end: endDate || undefined,
          search: search || undefined,
        }
      });
      setLogs(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setPages(res.data.pagination?.pages || 1);
    } catch {
      // Gracefully handle if endpoint doesn't exist yet
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, startDate, endDate, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const toggleExpand = (id: string) => setExpanded(prev => prev === id ? null : id);

  const hasFilters = entityFilter || actionFilter || startDate || endDate || search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-gold-400" /> Audit Log
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Full activity trail — {total} records
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dark-700 text-dark-400 hover:text-white hover:border-dark-600 text-sm transition-all"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by user, entity ID..."
              className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <select
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-gold-500/50"
          >
            <option value="">All Entities</option>
            <option value="invoice">Invoice</option>
            <option value="product">Product</option>
            <option value="customer">Customer</option>
            <option value="user">User</option>
            <option value="settings">Settings</option>
          </select>

          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-gold-500/50"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="POST">Post</option>
            <option value="REVERSE">Reverse</option>
            <option value="EXPORT">Export</option>
          </select>

          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-gold-500/50" />
          <span className="text-dark-500 text-sm">to</span>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-gold-500/50" />

          {hasFilters && (
            <button
              onClick={() => { setEntityFilter(''); setActionFilter(''); setStartDate(''); setEndDate(''); setSearch(''); setPage(1); }}
              className="text-xs text-red-400 border border-red-400/20 px-3 py-2 rounded-lg hover:bg-red-400/10 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Log Entries */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No audit logs found</p>
            <p className="text-dark-600 text-sm mt-1">Activity will appear here as users interact with the system</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {logs.map(log => {
              const isExpanded = expanded === log.id;
              const hasDiff = log.oldValues || log.newValues;
              const actionColor = actionColors[log.action?.toUpperCase()] || 'text-dark-400 bg-dark-800 border-dark-700';

              return (
                <div key={log.id} className="px-5 py-4 hover:bg-dark-800/20 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center flex-shrink-0 text-dark-400 mt-0.5">
                      {entityIcons[log.entityType?.toLowerCase()] || <Activity className="w-3.5 h-3.5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${actionColor}`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-white capitalize">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-xs font-mono text-dark-500">{log.entityId.slice(0, 12)}…</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-dark-500">
                        {log.user && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {log.user.name} ({log.user.email})
                          </span>
                        )}
                        <span>{formatDate(log.createdAt)}</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>

                      {/* Expand diff */}
                      {hasDiff && (
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="flex items-center gap-1 text-xs text-gold-400/70 hover:text-gold-400 mt-2 transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                          {isExpanded ? 'Hide' : 'Show'} change details
                        </button>
                      )}

                      {isExpanded && hasDiff && (
                        <JsonDiffViewer old={log.oldValues} neww={log.newValues} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-dark-800">
            <span className="text-xs text-dark-500">Page {page} of {pages} · {total} records</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-dark-700 text-dark-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-dark-700 text-dark-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
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
