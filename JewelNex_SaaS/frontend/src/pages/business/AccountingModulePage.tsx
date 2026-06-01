import React, { useState, useEffect } from 'react';
import { 
  FileText, BookOpen, Scale, Landmark, Calendar, 
  ArrowRight, Search, CheckCircle2, AlertTriangle, ArrowUpDown, ChevronDown, RefreshCw 
} from 'lucide-react';
import { 
  accountingService, AccountHead, Voucher, 
  TrialBalanceReport, ProfitLossReport, BalanceSheetReport 
} from '../../services/accountingService';
import { toast } from 'sonner';

export default function AccountingModulePage() {
  const [activeTab, setActiveTab] = useState<'daybook' | 'ledger' | 'trialbalance' | 'financials'>('daybook');
  const [financialSubTab, setFinancialSubTab] = useState<'pl' | 'bs'>('pl');

  // Filters
  const [startDate, setStartDate] = useState<string>('2026-04-01'); // Default to India Financial Year start
  const [endDate, setEndDate] = useState<string>('2026-06-30');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Data
  const [accountHeads, setAccountHeads] = useState<AccountHead[]>([]);
  const [dayBookData, setDayBookData] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const [ledgerData, setLedgerData] = useState<{
    head: AccountHead;
    openingBalance: number;
    entries: any[];
    closingBalance: number;
  } | null>(null);

  const [trialBalance, setTrialBalance] = useState<TrialBalanceReport | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize
  useEffect(() => {
    fetchHeads();
  }, []);

  const fetchHeads = async () => {
    try {
      const res = await accountingService.getHeads();
      if (res.success) {
        setAccountHeads(res.data);
        if (res.data.length > 0) {
          setSelectedAccountId(res.data[0].id);
        }
      }
    } catch (e: any) {
      toast.error('Failed to load accounts.');
    }
  };

  // Tab Loaders
  useEffect(() => {
    if (activeTab === 'daybook') {
      loadDayBook();
    } else if (activeTab === 'ledger') {
      if (selectedAccountId) loadLedger(selectedAccountId);
    } else if (activeTab === 'trialbalance') {
      loadTrialBalance();
    } else if (activeTab === 'financials') {
      loadFinancials();
    }
  }, [activeTab, startDate, endDate, selectedAccountId]);

  const loadDayBook = async () => {
    setLoading(true);
    try {
      const res = await accountingService.getDayBook(startDate, endDate);
      if (res.success) {
        setDayBookData(res.data);
        setSelectedVoucher(null);
      }
    } catch (e: any) {
      toast.error('Failed to load Day Book.');
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await accountingService.getLedger(id, startDate, endDate);
      if (res.success) {
        setLedgerData(res.data);
      }
    } catch (e: any) {
      toast.error('Failed to load ledger.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrialBalance = async () => {
    setLoading(true);
    try {
      const res = await accountingService.getTrialBalance(endDate); // Trial balance up to end date
      if (res.success) {
        setTrialBalance(res.data);
      }
    } catch (e: any) {
      toast.error('Failed to load Trial Balance.');
    } finally {
      setLoading(false);
    }
  };

  const loadFinancials = async () => {
    setLoading(true);
    try {
      const plRes = await accountingService.getProfitLoss(startDate, endDate);
      const bsRes = await accountingService.getBalanceSheet(endDate);
      if (plRes.success) setProfitLoss(plRes.data);
      if (bsRes.success) setBalanceSheet(bsRes.data);
    } catch (e: any) {
      toast.error('Failed to load financial statements.');
    } finally {
      setLoading(false);
    }
  };

  const initializeCOA = async () => {
    try {
      await accountingService.initializeCOA();
      toast.success('Chart of Accounts initialized successfully.');
      fetchHeads();
    } catch (e) {
      toast.error('Failed to initialize Chart of Accounts.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Landmark className="w-8 h-8 text-gold-500" />
            Double-Entry Accounting
          </h1>
          <p className="text-dark-400 text-sm mt-1">Real-time ledger audit, day books, trial balance, and dynamic statements</p>
        </div>
        
        {accountHeads.length === 0 ? (
          <button 
            onClick={initializeCOA}
            className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-dark-950 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-gold-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            Initialize Chart of Accounts
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-dark-900/50 border border-dark-800 p-2 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 px-3 text-dark-400 text-xs">
              <Calendar className="w-4 h-4 text-gold-500" />
              <span>Range:</span>
            </div>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-dark-950 border border-dark-800 text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-gold-500"
            />
            <span className="text-dark-600 text-xs">to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-dark-950 border border-dark-800 text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-gold-500"
            />
          </div>
        )}
      </div>

      {/* Primary Tab Selectors */}
      <div className="flex flex-wrap gap-2 border-b border-dark-800/80 pb-px">
        <button
          onClick={() => setActiveTab('daybook')}
          className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'daybook' 
              ? 'border-gold-500 text-gold-500 bg-gold-500/5' 
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Day Book
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'ledger' 
              ? 'border-gold-500 text-gold-500 bg-gold-500/5' 
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Account Ledger
        </button>
        <button
          onClick={() => setActiveTab('trialbalance')}
          className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'trialbalance' 
              ? 'border-gold-500 text-gold-500 bg-gold-500/5' 
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          Trial Balance
        </button>
        <button
          onClick={() => setActiveTab('financials')}
          className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'financials' 
              ? 'border-gold-500 text-gold-500 bg-gold-500/5' 
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Financial Statements
        </button>
      </div>

      {/* Main Tab Contents */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] bg-dark-950/20 border border-dark-900/50 rounded-3xl p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-gold-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-dark-400 text-sm font-medium">Running ledger queries...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-[50vh]">
          {/* TAB 1: DAY BOOK */}
          {activeTab === 'daybook' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Vouchers List */}
              <div className="lg:col-span-2 bg-dark-950/30 border border-dark-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Chronological Vouchers</h3>
                {dayBookData.length === 0 ? (
                  <p className="text-dark-500 text-sm text-center py-12">No vouchers posted in selected range.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-800 text-dark-400 text-xs font-bold uppercase tracking-wider">
                          <th className="py-4">Date</th>
                          <th className="py-4">Voucher No</th>
                          <th className="py-4">Type</th>
                          <th className="py-4">Narration</th>
                          <th className="py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-900 text-sm">
                        {dayBookData.map((v) => (
                          <tr key={v.id} className="hover:bg-dark-900/20 text-white transition-colors">
                            <td className="py-4">{new Date(v.date).toLocaleDateString()}</td>
                            <td className="py-4 font-mono font-bold text-gold-500">{v.voucherNumber}</td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                v.type === 'SALES' ? 'bg-emerald-500/10 text-emerald-400' :
                                v.type === 'PURCHASE' ? 'bg-blue-500/10 text-blue-400' :
                                v.type === 'RECEIPT' ? 'bg-amber-500/10 text-amber-400' :
                                v.type === 'PAYMENT' ? 'bg-purple-500/10 text-purple-400' :
                                'bg-dark-800 text-dark-300'
                              }`}>{v.type}</span>
                            </td>
                            <td className="py-4 text-dark-300 max-w-[200px] truncate">{v.narration || 'N/A'}</td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => setSelectedVoucher(v)}
                                className="text-xs bg-dark-800 hover:bg-dark-700 text-white px-3 py-1.5 rounded-lg transition-all"
                              >
                                View Entries
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Voucher Detail Side Panel */}
              <div className="bg-dark-950/30 border border-dark-800/80 rounded-3xl p-6 backdrop-blur-xl">
                {selectedVoucher ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-dark-500">Voucher Details</h4>
                      <h3 className="text-xl font-black text-white mt-1">{selectedVoucher.voucherNumber}</h3>
                      <div className="flex gap-4 text-xs text-dark-400 mt-2">
                        <span>Date: {new Date(selectedVoucher.date).toLocaleDateString()}</span>
                        <span>Type: {selectedVoucher.type}</span>
                      </div>
                    </div>

                    <div className="border-t border-dark-800 pt-4 space-y-4">
                      <h4 className="text-sm font-bold text-white">Double-Entry Postings</h4>
                      <div className="space-y-3">
                        {selectedVoucher.entries.map((entry) => (
                          <div key={entry.id} className="flex justify-between items-center bg-dark-900/30 border border-dark-900 p-3 rounded-xl">
                            <div>
                              <p className="text-sm font-semibold text-white">{entry.account?.name || 'Account Head'}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                entry.type === 'DR' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              }`}>{entry.type === 'DR' ? 'DEBIT' : 'CREDIT'}</span>
                            </div>
                            <p className="text-sm font-bold text-white">₹{Number(entry.amount).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedVoucher.narration && (
                      <div className="border-t border-dark-800 pt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark-500">Narration</h4>
                        <p className="text-sm text-dark-300 mt-1 italic">"{selectedVoucher.narration}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText className="w-12 h-12 text-dark-600 mb-3" />
                    <p className="text-dark-500 text-sm">Select a voucher to view its Debit/Credit breakdown.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              {/* Account Selector */}
              <div className="bg-dark-950/30 border border-dark-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:max-w-md">
                  <Search className="w-5 h-5 text-dark-500" />
                  <select 
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-800 text-white px-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:border-gold-500"
                  >
                    <option value="" disabled>Select Account Head</option>
                    {accountHeads.map((head) => (
                      <option key={head.id} value={head.id}>
                        {head.name} ({head.group.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cash/Bank Quick buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const cash = accountHeads.find(h => h.name === 'Cash Account');
                      if (cash) setSelectedAccountId(cash.id);
                    }}
                    className="text-xs bg-dark-900 hover:bg-dark-800 text-white px-4 py-2.5 rounded-xl border border-dark-800 transition-all font-bold"
                  >
                    Cash Book
                  </button>
                  <button 
                    onClick={() => {
                      const bank = accountHeads.find(h => h.name === 'HDFC Bank');
                      if (bank) setSelectedAccountId(bank.id);
                    }}
                    className="text-xs bg-dark-900 hover:bg-dark-800 text-white px-4 py-2.5 rounded-xl border border-dark-800 transition-all font-bold"
                  >
                    Bank Book
                  </button>
                </div>
              </div>

              {/* Ledger Card */}
              {ledgerData && (
                <div className="bg-dark-950/30 border border-dark-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
                  {/* Ledger Header */}
                  <div className="flex justify-between items-start border-b border-dark-800/80 pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded">
                        Ledger Account
                      </span>
                      <h2 className="text-2xl font-black text-white mt-1">{ledgerData.head.name}</h2>
                      <p className="text-xs text-dark-400 mt-1">Group: {ledgerData.head.group.name} | Type: {ledgerData.head.group.type}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-dark-500">Normal Balance Type</p>
                      <p className="text-sm font-bold text-white">{ledgerData.head.balanceType}</p>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-dark-900/30 border border-dark-800 p-4 rounded-2xl">
                      <p className="text-xs text-dark-500 font-bold uppercase tracking-wider">Opening Balance</p>
                      <p className="text-xl font-bold text-white mt-1">₹{ledgerData.openingBalance.toFixed(2)}</p>
                    </div>
                    <div className="bg-dark-900/30 border border-dark-800 p-4 rounded-2xl">
                      <p className="text-xs text-dark-500 font-bold uppercase tracking-wider">Net Range Flow</p>
                      <p className="text-xl font-bold text-white mt-1">
                        ₹{(ledgerData.closingBalance - ledgerData.openingBalance).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-dark-900/30 border border-dark-850 p-4 rounded-2xl border-gold-500/20">
                      <p className="text-xs text-gold-500 font-bold uppercase tracking-wider">Closing Balance</p>
                      <p className="text-xl font-black text-white mt-1">₹{ledgerData.closingBalance.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Entries list */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-850 text-dark-400 text-xs font-bold uppercase tracking-wider">
                          <th className="py-4">Date</th>
                          <th className="py-4">Voucher No</th>
                          <th className="py-4">Narration</th>
                          <th className="py-4 text-right">Debit (DR)</th>
                          <th className="py-4 text-right">Credit (CR)</th>
                          <th className="py-4 text-right">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-900 text-sm">
                        {/* Opening Balance Row */}
                        <tr className="text-dark-400 font-medium">
                          <td className="py-4">-</td>
                          <td className="py-4 font-mono font-bold">-</td>
                          <td className="py-4 italic">Opening Balance</td>
                          <td className="py-4 text-right">-</td>
                          <td className="py-4 text-right">-</td>
                          <td className="py-4 text-right font-bold">₹{ledgerData.openingBalance.toFixed(2)}</td>
                        </tr>

                        {/* Entries */}
                        {ledgerData.entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-dark-900/10 text-white transition-colors">
                            <td className="py-4">{new Date(entry.voucher.date).toLocaleDateString()}</td>
                            <td className="py-4 font-mono font-bold text-gold-500">{entry.voucher.voucherNumber}</td>
                            <td className="py-4 text-dark-300 max-w-[250px] truncate">
                              {entry.voucher.narration || 'N/A'}
                            </td>
                            <td className="py-4 text-right text-emerald-400 font-medium">
                              {entry.type === 'DR' ? `₹${entry.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="py-4 text-right text-red-400 font-medium">
                              {entry.type === 'CR' ? `₹${entry.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="py-4 text-right font-bold text-white">
                              ₹{entry.runningBalance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRIAL BALANCE */}
          {activeTab === 'trialbalance' && trialBalance && (
            <div className="bg-dark-950/30 border border-dark-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
              {/* Balance Verification Banner */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                trialBalance.balanced 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {trialBalance.balanced ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm font-semibold">Ledger is mathematically correct. Total Debits balance with Total Credits.</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    <p className="text-sm font-semibold">Trial balance is out of balance. Check journal adjustments.</p>
                  </>
                )}
              </div>

              {/* Trial Balance Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dark-800 text-dark-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4">Account Head</th>
                      <th className="py-4">Group Category</th>
                      <th className="py-4 text-right">Debit (DR) Balance</th>
                      <th className="py-4 text-right">Credit (CR) Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-900 text-sm">
                    {trialBalance.rows.map((row) => (
                      <tr key={row.headId} className="hover:bg-dark-900/10 text-white transition-colors">
                        <td className="py-4 font-medium">{row.headName}</td>
                        <td className="py-4 text-dark-400">{row.groupName} ({row.groupType})</td>
                        <td className="py-4 text-right text-emerald-400 font-bold">
                          {row.debit > 0 ? `₹${row.debit.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-4 text-right text-red-400 font-bold">
                          {row.credit > 0 ? `₹${row.credit.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="border-t-2 border-dark-800 font-bold text-white bg-dark-900/30">
                      <td className="py-4 pl-4" colSpan={2}>Check Total Verification</td>
                      <td className="py-4 text-right pr-2 text-emerald-400 font-black">
                        ₹{trialBalance.totalDebit.toFixed(2)}
                      </td>
                      <td className="py-4 text-right text-red-400 font-black">
                        ₹{trialBalance.totalCredit.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIAL STATEMENTS (P&L AND BALANCE SHEET) */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              {/* Financial sub-selectors */}
              <div className="flex gap-2 bg-dark-900/50 p-1 rounded-xl w-fit border border-dark-800">
                <button
                  onClick={() => setFinancialSubTab('pl')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    financialSubTab === 'pl' ? 'bg-gold-600 text-dark-950 font-black' : 'text-dark-400 hover:text-white'
                  }`}
                >
                  Profit & Loss Statement
                </button>
                <button
                  onClick={() => setFinancialSubTab('bs')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    financialSubTab === 'bs' ? 'bg-gold-600 text-dark-950 font-black' : 'text-dark-400 hover:text-white'
                  }`}
                >
                  Balance Sheet
                </button>
              </div>

              {/* P&L Statement */}
              {financialSubTab === 'pl' && profitLoss && (
                <div className="bg-dark-950/30 border border-dark-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white">Income Statement (Profit & Loss)</h2>
                    <p className="text-xs text-dark-400 mt-1">Valued dynamically under Weighted Average Cost (WAC) methodology</p>
                  </div>

                  <div className="divide-y divide-dark-900">
                    {/* Revenue Section */}
                    <div className="py-4">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-2">Revenues</h3>
                      <div className="flex justify-between items-center text-sm text-white py-2">
                        <span>Sales Revenue (General Sales)</span>
                        <span className="font-bold">₹{profitLoss.salesRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-white py-2">
                        <span>Discount Received</span>
                        <span className="font-bold">₹{profitLoss.discountReceived.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Cost of Goods Sold */}
                    <div className="py-4">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-2">Cost of Goods Sold (COGS)</h3>
                      <div className="flex justify-between items-center text-sm text-white py-2">
                        <span>Dynamic Materials/Stock Cost (WAC Valued)</span>
                        <span className="font-bold text-red-400">₹{profitLoss.cogs.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-white font-bold border-t border-dark-900 mt-2 py-2">
                        <span>Gross Profit</span>
                        <span className="text-emerald-400">₹{profitLoss.grossProfit.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Operating Expenses */}
                    <div className="py-4">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-2">Operating Expenses</h3>
                      <div className="flex justify-between items-center text-sm text-white py-2">
                        <span>Discount Allowed (Expense)</span>
                        <span className="font-bold text-red-400">₹{profitLoss.discountAllowed.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Bottom Line */}
                    <div className="py-4 bg-dark-900/10 rounded-xl px-4 mt-2">
                      <div className="flex justify-between items-center text-lg font-black text-white">
                        <span>Net Profit / Net Margin</span>
                        <span className={profitLoss.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          ₹{profitLoss.netProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Sheet Statement */}
              {financialSubTab === 'bs' && balanceSheet && (
                <div className="bg-dark-950/30 border border-dark-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white">Balance Sheet Statement</h2>
                    <p className="text-xs text-dark-400 mt-1">Assets, Liabilities, and Owner's Equity aggregates</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ASSETS SECTION */}
                    <div className="space-y-4">
                      <h3 className="text-md font-bold text-gold-500 border-b border-dark-800 pb-2">Assets</h3>
                      <div className="space-y-2">
                        {balanceSheet.assets.list.map((item) => (
                          <div key={item.headId} className="flex justify-between text-sm text-white py-1">
                            <span>{item.name}</span>
                            <span className="font-semibold">₹{Number(item.balance).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-md font-bold text-white bg-dark-900/40 p-3 rounded-xl border border-dark-800">
                        <span>Total Assets</span>
                        <span className="text-emerald-400">₹{balanceSheet.assets.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* LIABILITIES & EQUITY SECTION */}
                    <div className="space-y-6">
                      {/* Liabilities */}
                      <div className="space-y-4">
                        <h3 className="text-md font-bold text-gold-500 border-b border-dark-800 pb-2">Liabilities</h3>
                        <div className="space-y-2">
                          {balanceSheet.liabilities.list.map((item) => (
                            <div key={item.headId} className="flex justify-between text-sm text-white py-1">
                              <span>{item.name}</span>
                              <span className="font-semibold">₹{Number(item.balance).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Owner's Equity */}
                      <div className="space-y-4">
                        <h3 className="text-md font-bold text-gold-500 border-b border-dark-800 pb-2">Equity</h3>
                        <div className="space-y-2">
                          {balanceSheet.equity.list.map((item) => (
                            <div key={item.headId} className="flex justify-between text-sm text-white py-1">
                              <span>{item.name}</span>
                              <span className="font-semibold">₹{Number(item.balance).toFixed(2)}</span>
                            </div>
                          ))}
                          {/* Retained Earnings Link */}
                          <div className="flex justify-between text-sm text-white py-1">
                            <span>Retained Earnings (From P&L)</span>
                            <span className="font-semibold text-emerald-400">
                              ₹{balanceSheet.equity.retainedEarnings.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Total Liabilities & Equity */}
                      <div className="flex justify-between text-md font-bold text-white bg-dark-900/40 p-3 rounded-xl border border-dark-800">
                        <span>Total Liabilities & Equity</span>
                        <span className="text-red-400">₹{balanceSheet.totalEquityAndLiabilities.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Math proof equations */}
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-bold ${
                    balanceSheet.balanced 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {balanceSheet.balanced ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <p>Mathematical Equation Balanced: Assets (₹{balanceSheet.assets.total.toFixed(2)}) = Liabilities + Equity (₹{balanceSheet.totalEquityAndLiabilities.toFixed(2)})</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <p>Equation Compromised: Assets and Liabilities are out of balance.</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
