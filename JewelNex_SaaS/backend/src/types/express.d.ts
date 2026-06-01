// Global Express Request type extension — augments req.user across all controllers
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string; // alias for id — used in invoice controllers
        email: string;
        role: string;
      };
    }
  }
}
