import { z } from 'zod';
export declare const createProductSchema: z.ZodObject<{
    sku: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    grossWeight: z.ZodDefault<z.ZodNumber>;
    stoneWeight: z.ZodDefault<z.ZodNumber>;
    netWeight: z.ZodDefault<z.ZodNumber>;
    purity: z.ZodDefault<z.ZodNumber>;
    fineWeight: z.ZodDefault<z.ZodNumber>;
    wastagePercent: z.ZodDefault<z.ZodNumber>;
    makingCharge: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const stockMovementSchema: z.ZodObject<{
    productId: z.ZodString;
    lotId: z.ZodOptional<z.ZodString>;
    transactionId: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<{
        OPENING: "OPENING";
        PURCHASE: "PURCHASE";
        SALE: "SALE";
        RETURN: "RETURN";
        ADJUSTMENT: "ADJUSTMENT";
    }>;
    fromLocationId: z.ZodOptional<z.ZodString>;
    toLocationId: z.ZodOptional<z.ZodString>;
    quantityDelta: z.ZodNumber;
    weightDelta: z.ZodNumber;
}, z.core.$strip>;
export declare const stockTransferSchema: z.ZodObject<{
    productId: z.ZodString;
    lotId: z.ZodOptional<z.ZodString>;
    transactionId: z.ZodOptional<z.ZodString>;
    fromLocationId: z.ZodString;
    toLocationId: z.ZodString;
    quantity: z.ZodNumber;
    weight: z.ZodNumber;
}, z.core.$strip>;
//# sourceMappingURL=inventory.validator.d.ts.map