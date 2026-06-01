import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes';
import inventoryRoutes from './routes/inventory.routes';
import locationRoutes from './routes/location.routes';
import invoiceRoutes from './routes/invoice.routes';
import customerRoutes from './routes/customer.routes';
import accountingRoutes from './routes/accounting.routes';
import settingsRoutes from './routes/settings.routes';
import exportRoutes from './routes/export.routes';
import auditLogRoutes from './routes/auditlog.routes';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/env';

const app = express();

// ─── 1. Security Headers ─────────────────
app.use(helmet());

// ─── 2. CORS Configuration ──────────────
const allowedOrigins = (env.CORS_ORIGINS || '').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ─── 3. Request Parsing ──────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// ─── 5. Health Check ──────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── 6. API Routes (v1) ──────────────────
app.get('/api/v1', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'JewelNex SaaS API v1 is running',
    version: '1.0.0',
    documentation: 'https://github.com/Sandeep-Ynr/JewelNex'
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/accounting', accountingRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);

// ─── 7. 404 Handler ──────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── 8. Global Error Handler ─────────────
app.use(errorHandler);

export default app;
