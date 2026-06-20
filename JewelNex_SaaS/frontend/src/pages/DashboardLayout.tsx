import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Gem, LayoutDashboard, Package, FileText, Users,
  Settings, LogOut, BarChart3, Menu, X, ChevronRight, MapPin,
  Bell, Search, Sparkles, ArrowLeftRight, Receipt, ClipboardList, Activity, Building2,
  Sun, Moon,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { toast } from 'sonner';

const navGroups = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    ]
  },
  {
    label: 'Inventory',
    items: [
      { icon: Package, label: 'Products', to: '/dashboard/inventory' },
      { icon: FileText, label: 'Stock Ledger', to: '/dashboard/inventory/ledger' },
      { icon: ArrowLeftRight, label: 'Movements', to: '/dashboard/inventory/movements' },
      { icon: MapPin, label: 'Locations', to: '/dashboard/inventory/locations' },
    ]
  },
  {
    label: 'Business',
    items: [
      { icon: FileText, label: 'New Invoice', to: '/dashboard/invoices' },
      { icon: ClipboardList, label: 'Draft Invoices', to: '/dashboard/invoices/drafts' },
      { icon: Receipt, label: 'Invoice Register', to: '/dashboard/invoices/list' },
      { icon: Users, label: 'Customers', to: '/dashboard/customers' },
      { icon: BarChart3, label: 'Accounting', to: '/dashboard/accounting' },
    ]
  },
  {
    label: 'System',
    items: [
      { icon: Building2, label: 'Company Settings', to: '/dashboard/settings' },
      { icon: Activity, label: 'Audit Log', to: '/dashboard/audit-log' },
    ]
  }
];

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredNavGroups = navGroups.map(group => {
    const items = group.items.filter(item => {
      const role = user?.role?.toLowerCase();
      if (item.to === '/dashboard/accounting') {
        return role === 'admin' || role === 'manager';
      }
      if (item.to === '/dashboard/settings' || item.to === '/dashboard/audit-log') {
        return role === 'admin';
      }
      return true;
    });
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  // Derive page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview';
    if (path.includes('/inventory/ledger')) return 'Stock Ledger';
    if (path.includes('/inventory/locations')) return 'Locations';
    if (path.includes('/inventory/movements')) return 'Movements';
    if (path.includes('/inventory')) return 'Inventory';
    if (path.includes('/invoices/drafts')) return 'Draft Invoices';
    if (path.includes('/invoices/list')) return 'Invoice Register';
    if (path.includes('/invoices') && path.includes('/thermal')) return 'Thermal Receipt';
    if (path.includes('/invoices')) return 'New Invoice';
    if (path.includes('/customers')) return 'Customers';
    if (path.includes('/accounting')) return 'Accounting';
    if (path.includes('/audit-log')) return 'Audit Log';
    if (path.includes('/settings')) return 'Company Settings';
    return 'Dashboard';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-dark-800 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-gold-500 to-gold-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-gold-500/20">
          <Gem className="w-5 h-5 text-dark-950" />
        </div>
        <div>
          <h1 className="text-white font-black text-lg leading-none tracking-tight">JewelNex</h1>
          <p className="text-dark-500 text-[10px] font-medium uppercase tracking-widest mt-0.5">Smart ERP v1.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5 scrollbar-hide">
        {filteredNavGroups.map((group) => (
          <div key={group.label}>
            <p className="text-dark-600 text-[9px] uppercase tracking-[0.2em] font-bold px-3 mb-2">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group relative
                    ${isActive
                      ? 'text-gold-400 bg-gold-500/10 border border-gold-500/20 shadow-sm'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gold-400 rounded-full" />
                      )}
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gold-400' : 'text-dark-500 group-hover:text-dark-300'}`} />
                      <span className="flex-1">{label}</span>
                      <ChevronRight className={`w-3 h-3 transition-opacity ${isActive ? 'opacity-50' : 'opacity-0 group-hover:opacity-30'}`} />
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile + Logout */}
      <div className="flex-shrink-0 px-3 pb-5 pt-3 border-t border-dark-800">
        {/* Phase Badge */}
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-gold-500/5 border border-gold-500/10">
          <Sparkles className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
          <span className="text-gold-400 text-[10px] font-bold">Phase C — Inventory Live</span>
        </div>
        
        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-800 border border-dark-700 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-700 rounded-lg flex items-center justify-center text-dark-950 text-xs font-black flex-shrink-0 shadow">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold truncate leading-tight">{user?.name}</p>
            <p className="text-dark-500 text-[10px] uppercase tracking-wider font-medium">{user?.role}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-dark-400 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-dark-900 border-r border-dark-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 bg-dark-900 border-r border-dark-800 flex flex-col z-10 shadow-2xl animate-slide-up">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-dark-900/80 backdrop-blur-md border-b border-dark-800 flex items-center px-6 gap-4 flex-shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-dark-400 hover:text-white p-2 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title */}
          <div className="flex-1">
            <p className="text-white font-bold text-base leading-none">{getPageTitle()}</p>
            <p className="text-dark-500 text-xs mt-0.5 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search — desktop only */}
            <button className="hidden md:flex items-center gap-2 bg-dark-800 border border-dark-700 px-3 py-2 rounded-xl text-sm text-dark-500 hover:border-dark-600 hover:text-dark-300 transition-all">
              <Search className="w-4 h-4" />
              <span className="text-xs">Search...</span>
              <kbd className="text-[9px] bg-dark-700 px-1.5 py-0.5 rounded font-mono ml-4 hidden lg:inline">⌘K</kbd>
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl border border-transparent hover:border-dark-700 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold-400 rounded-full" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl border border-transparent hover:border-dark-700 transition-all flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-gold-400" /> : <Moon className="w-5 h-5 text-gold-600" />}
            </button>

            {/* User badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-dark-800">
              <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-700 rounded-lg flex items-center justify-center text-dark-950 text-xs font-black shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-white text-xs font-bold leading-none">{user?.name?.split(' ')[0]}</p>
                <p className="text-dark-500 text-[10px] uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
