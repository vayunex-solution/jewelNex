import { Request, Response, NextFunction } from 'express';
export declare class AuditLogController {
    /**
     * GET /api/v1/audit-logs
     * Query params: entity, action, search, start, end, page, limit
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/audit-logs  (internal utility — can be used by middleware)
     */
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=auditlog.controller.d.ts.map