import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import InventoryPage from './pages/inventory/InventoryPage';
import InventoryLedgerPage from './pages/inventory/InventoryLedgerPage';
import LocationPage from './pages/inventory/LocationPage';
import CreateInvoicePage from './pages/business/CreateInvoicePage';
import DraftInvoicesPage from './pages/business/DraftInvoicesPage';
import PostedInvoicesPage from './pages/business/PostedInvoicesPage';
import ThermalReceiptPage from './pages/business/ThermalReceiptPage';
import AccountingModulePage from './pages/business/AccountingModulePage';
import CompanySettingsPage from './pages/settings/CompanySettingsPage';
import AuditLogPage from './pages/settings/AuditLogPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: '#1e1e1e',
            border: '1px solid #2a2a2a',
            color: '#fff',
          },
        }}
      />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Guest-only routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            {/* Real routes */}
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/ledger" element={<InventoryLedgerPage />} />
            <Route path="inventory/locations" element={<LocationPage />} />
            {/* Real routes for Invoices */}
            <Route path="invoices" element={<CreateInvoicePage />} />
            <Route path="invoices/edit/:id" element={<CreateInvoicePage />} />
            <Route path="invoices/drafts" element={<DraftInvoicesPage />} />
            <Route path="invoices/list" element={<PostedInvoicesPage />} />
            <Route path="invoices/:id/thermal" element={<ThermalReceiptPage />} />
            {/* Real route for Accounting Reports */}
            <Route path="accounting" element={<AccountingModulePage />} />
            {/* Placeholder routes for future modules */}
            <Route path="customers" element={<ComingSoon label="Customers Module" />} />
            {/* Settings & Admin */}
            <Route path="settings" element={<CompanySettingsPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Placeholder for Phase 2 modules
const ComingSoon = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="text-center">
      <p className="text-5xl mb-4">🚧</p>
      <h2 className="text-xl font-bold text-white mb-2">{label}</h2>
      <p className="text-dark-400 text-sm">This module will be built in Phase 2.</p>
    </div>
  </div>
);

export default App;
