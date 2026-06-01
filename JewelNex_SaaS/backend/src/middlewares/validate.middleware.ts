import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { errorResponse } from '../utils/apiResponse';

// ─────────────────────────────────────────
// Validate Request Body Middleware (Zod)
// Usage: validate(mySchema)
// ─────────────────────────────────────────
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
      res.status(400).json(errorResponse('Validation failed', errors.join(', ')));
      return;
    }
    req.body = result.data; // Replace with sanitized, validated data
    next();
  };
};
