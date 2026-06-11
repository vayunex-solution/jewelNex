import { Prisma } from '@prisma/client';
export declare class InventoryService {
    /**
     * Prisma CRUD: Create a new product
     */
    static createProduct(data: any, companyId: string): Promise<{
        id: string;
        sku: string;
        name: string;
        companyId: string | null;
        description: string | null;
        grossWeight: Prisma.Decimal;
        stoneWeight: Prisma.Decimal;
        netWeight: Prisma.Decimal;
        purity: Prisma.Decimal;
        fineWeight: Prisma.Decimal;
        wastagePercent: Prisma.Decimal;
        makingCharge: Prisma.Decimal;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Prisma CRUD: Get all products
     */
    static getProducts(skip?: number, take?: number, companyId?: string): Promise<({
        lots: {
            id: string;
            productId: string;
            barcode: string | null;
            rfid: string | null;
            locationId: string;
            quantity: number;
            weight: Prisma.Decimal;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        sku: string;
        name: string;
        companyId: string | null;
        description: string | null;
        grossWeight: Prisma.Decimal;
        stoneWeight: Prisma.Decimal;
        netWeight: Prisma.Decimal;
        purity: Prisma.Decimal;
        fineWeight: Prisma.Decimal;
        wastagePercent: Prisma.Decimal;
        makingCharge: Prisma.Decimal;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    /**
     * Prisma CRUD: Get stock ledger audit trail
     */
    static getMovements(skip?: number, take?: number, companyId?: string): Promise<({
        user: {
            name: string;
            email: string;
        };
        product: {
            id: string;
            sku: string;
            name: string;
            companyId: string | null;
            description: string | null;
            grossWeight: Prisma.Decimal;
            stoneWeight: Prisma.Decimal;
            netWeight: Prisma.Decimal;
            purity: Prisma.Decimal;
            fineWeight: Prisma.Decimal;
            wastagePercent: Prisma.Decimal;
            makingCharge: Prisma.Decimal;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        lot: {
            id: string;
            productId: string;
            barcode: string | null;
            rfid: string | null;
            locationId: string;
            quantity: number;
            weight: Prisma.Decimal;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        productId: string;
        lotId: string | null;
        transactionId: string | null;
        type: string;
        fromLocationId: string | null;
        toLocationId: string | null;
        quantityDelta: number;
        weightDelta: Prisma.Decimal;
        isReversed: boolean;
        reversalForId: string | null;
        userId: string;
        createdAt: Date;
    })[]>;
    /**
     * Stored Procedure: Process a stock movement
     */
    static processStockMovement(data: {
        id?: string;
        productId: string;
        lotId?: string;
        transactionId?: string;
        type: string;
        fromLocationId?: string;
        toLocationId?: string;
        quantityDelta: number;
        weightDelta: number;
        userId: string;
    }): Promise<{
        movementId: string;
        status: string;
    }>;
    /**
     * Stored Procedure: Transfer stock atomically
     */
    static transferStock(data: {
        productId: string;
        lotId?: string;
        transactionId?: string;
        fromLocationId: string;
        toLocationId: string;
        quantity: number;
        weight: number;
        userId: string;
    }): Promise<{
        outId: string;
        inId: string;
        status: string;
    }>;
    /**
     * Stored Procedure: Reverse a movement
     */
    static reverseMovement(originalMovementId: string, userId: string): Promise<{
        newMovementId: string;
        status: string;
    }>;
    /**
     * Dashboard Stats: Calculate summary metrics
     */
    static getDashboardStats(companyId?: string): Promise<{
        totalProducts: number;
        totalQuantity: number;
        totalWeight: number | Prisma.Decimal;
        recentMovements: ({
            user: {
                name: string;
            };
            product: {
                name: string;
                sku: string;
            };
        } & {
            id: string;
            productId: string;
            lotId: string | null;
            transactionId: string | null;
            type: string;
            fromLocationId: string | null;
            toLocationId: string | null;
            quantityDelta: number;
            weightDelta: Prisma.Decimal;
            isReversed: boolean;
            reversalForId: string | null;
            userId: string;
            createdAt: Date;
        })[];
        lowStockItems: ({
            product: {
                id: string;
                sku: string;
                name: string;
                companyId: string | null;
                description: string | null;
                grossWeight: Prisma.Decimal;
                stoneWeight: Prisma.Decimal;
                netWeight: Prisma.Decimal;
                purity: Prisma.Decimal;
                fineWeight: Prisma.Decimal;
                wastagePercent: Prisma.Decimal;
                makingCharge: Prisma.Decimal;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            productId: string;
            barcode: string | null;
            rfid: string | null;
            locationId: string;
            quantity: number;
            weight: Prisma.Decimal;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
}
//# sourceMappingURL=inventory.service.d.ts.map