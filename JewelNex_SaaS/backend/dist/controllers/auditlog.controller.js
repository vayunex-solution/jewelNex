"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const database_1 = __importDefault(require("../config/database"));
class AuditLogController {
    /**
     * GET /api/v1/audit-logs
     * Query params: entity, action, search, start, end, page, limit
     */
    static async list(req, res, next) {
        try {
            const { entity, action, search, start, end, page = '1', limit = '25', } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const take = parseInt(limit);
            const where = {};
            if (entity)
                where.entityType = { contains: entity };
            if (action)
                where.action = { contains: action.toUpperCase() };
            if (search) {
                where.OR = [
                    { entityId: { contains: search } },
                    { entityType: { contains: search } },
                ];
            }
            if (start || end) {
                where.createdAt = {};
                if (start)
                    where.createdAt.gte = new Date(start);
                if (end)
                    where.createdAt.lte = new Date(end);
            }
            const [logs, total] = await Promise.all([
                database_1.default.auditTrail.findMany({
                    where,
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take,
                }),
                database_1.default.auditTrail.count({ where }),
            ]);
            res.status(200).json({
                success: true,
                data: logs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: take,
                    pages: Math.ceil(total / take),
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/audit-logs  (internal utility — can be used by middleware)
     */
    static async create(req, res, next) {
        try {
            const { entityType, entityId, action, oldValues, newValues } = req.body;
            const userId = req.user?.userId;
            const log = await database_1.default.auditTrail.create({
                data: {
                    entityType,
                    entityId,
                    action,
                    oldValues: oldValues ?? undefined,
                    newValues: newValues ?? undefined,
                    userId: userId ?? undefined,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                }
            });
            res.status(201).json({ success: true, data: log });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditLogController = AuditLogController;
//# sourceMappingURL=auditlog.controller.js.map