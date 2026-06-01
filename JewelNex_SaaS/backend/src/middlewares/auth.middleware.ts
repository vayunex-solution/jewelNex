import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { errorResponse } from '../utils/apiResponse';
import prisma from '../config/database';

// ─────────────────────────────────────────
// Extend Request with user payload
// ─────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: string;
  };
}

// ─────────────────────────────────────────
// JWT Authentication Middleware
// ─────────────────────────────────────────
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    // Also accept ?token= query param for browser-triggered file downloads (PDF, XLSX, CSV)
    const queryToken = req.query?.token as string | undefined;

    if (!authHeader?.startsWith('Bearer ') && !queryToken) {
      res.status(401).json(errorResponse('Unauthorized: No token provided'));
      return;
    }

    const token = queryToken ?? authHeader!.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, isActive: true, role: { select: { name: true } } },
    });

    if (!user || !user.isActive) {
      res.status(401).json(errorResponse('Unauthorized: Account not found or inactive'));
      return;
    }

    req.user = { id: user.id, userId: user.id, email: user.email, role: user.role.name };
    next();
  } catch {
    res.status(401).json(errorResponse('Unauthorized: Invalid or expired token'));
  }
};

// ─────────────────────────────────────────
// RBAC Middleware — Authorize Roles
// Usage: authorize('admin', 'superadmin')
// ─────────────────────────────────────────
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json(errorResponse('Forbidden: Insufficient permissions'));
      return;
    }
    next();
  };
};
