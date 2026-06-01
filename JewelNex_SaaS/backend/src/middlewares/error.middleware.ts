import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse';

// ─────────────────────────────────────────
// Global Error Handler Middleware
// Must be registered LAST in app.ts
// Ensures no stack traces leak to client in production
// ─────────────────────────────────────────
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Prevent leaking internal error details in production
  const isDev = process.env.NODE_ENV === 'development';
  res
    .status(500)
    .json(errorResponse('Internal server error', isDev ? err.message : undefined));
};

// ─────────────────────────────────────────
// 404 Not Found Handler
// ─────────────────────────────────────────
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json(errorResponse(`Route not found: ${req.method} ${req.path}`));
};
