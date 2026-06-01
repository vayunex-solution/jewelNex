import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function deployProcedures() {
  console.log('Deploying Stored Procedures...');

  const sp1 = `
    CREATE PROCEDURE sp_ProcessStockMovement(
        IN p_id VARCHAR(36),
        IN p_productId VARCHAR(36),
        IN p_lotId VARCHAR(36),
        IN p_transactionId VARCHAR(36),
        IN p_type VARCHAR(50),
        IN p_fromLocationId VARCHAR(36),
        IN p_toLocationId VARCHAR(36),
        IN p_quantityDelta INT,
        IN p_weightDelta DECIMAL(10,3),
        IN p_userId VARCHAR(36)
    )
    BEGIN
        DECLARE v_currentQty INT DEFAULT 0;

        START TRANSACTION;

        IF p_quantityDelta < 0 AND p_fromLocationId IS NOT NULL THEN
            SELECT quantity INTO v_currentQty 
            FROM inventory_lots 
            WHERE id = p_lotId 
            FOR UPDATE;

            IF v_currentQty + p_quantityDelta < 0 THEN
                ROLLBACK;
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient stock to process this movement. Negative stock is disabled.';
            END IF;
        END IF;

        INSERT INTO stock_movements (
            id, productId, lotId, transactionId, type, 
            fromLocationId, toLocationId, quantityDelta, weightDelta, 
            isReversed, userId, createdAt
        ) VALUES (
            p_id, p_productId, p_lotId, p_transactionId, p_type, 
            p_fromLocationId, p_toLocationId, p_quantityDelta, p_weightDelta, 
            FALSE, p_userId, NOW(3)
        );

        IF p_toLocationId IS NOT NULL AND p_quantityDelta > 0 THEN
            UPDATE inventory_lots 
            SET quantity = quantity + p_quantityDelta,
                weight = weight + p_weightDelta,
                updatedAt = NOW(3)
            WHERE id = p_lotId;
        END IF;

        IF p_fromLocationId IS NOT NULL AND p_quantityDelta < 0 THEN
            UPDATE inventory_lots 
            SET quantity = quantity + p_quantityDelta,
                weight = weight + p_weightDelta,
                updatedAt = NOW(3)
            WHERE id = p_lotId;
        END IF;

        COMMIT;
    END;
  `;

  const sp2 = `
    CREATE PROCEDURE sp_ReverseStockMovement(
        IN p_originalMovementId VARCHAR(36),
        IN p_newMovementId VARCHAR(36),
        IN p_userId VARCHAR(36)
    )
    BEGIN
        DECLARE v_productId VARCHAR(36);
        DECLARE v_lotId VARCHAR(36);
        DECLARE v_transactionId VARCHAR(36);
        DECLARE v_type VARCHAR(50);
        DECLARE v_fromLocationId VARCHAR(36);
        DECLARE v_toLocationId VARCHAR(36);
        DECLARE v_qtyDelta INT;
        DECLARE v_weightDelta DECIMAL(10,3);
        DECLARE v_isReversed BOOLEAN;

        START TRANSACTION;

        SELECT productId, lotId, transactionId, type, fromLocationId, toLocationId, quantityDelta, weightDelta, isReversed
        INTO v_productId, v_lotId, v_transactionId, v_type, v_fromLocationId, v_toLocationId, v_qtyDelta, v_weightDelta, v_isReversed
        FROM stock_movements
        WHERE id = p_originalMovementId FOR UPDATE;

        IF v_isReversed = TRUE THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Movement is already reversed.';
        END IF;

        UPDATE stock_movements SET isReversed = TRUE WHERE id = p_originalMovementId;

        INSERT INTO stock_movements (
            id, productId, lotId, transactionId, type, 
            fromLocationId, toLocationId, quantityDelta, weightDelta, 
            isReversed, reversalForId, userId, createdAt
        ) VALUES (
            p_newMovementId, v_productId, v_lotId, v_transactionId, CONCAT(v_type, '_REVERSAL'), 
            v_toLocationId, v_fromLocationId, -v_qtyDelta, -v_weightDelta, 
            FALSE, p_originalMovementId, p_userId, NOW(3)
        );

        IF v_lotId IS NOT NULL THEN
            UPDATE inventory_lots 
            SET quantity = quantity - v_qtyDelta,
                weight = weight - v_weightDelta,
                updatedAt = NOW(3)
            WHERE id = v_lotId;
        END IF;

        COMMIT;
    END;
  `;

  const sp3 = `
    CREATE PROCEDURE sp_TransferStock(
        IN p_outId VARCHAR(36),
        IN p_inId VARCHAR(36),
        IN p_productId VARCHAR(36),
        IN p_lotId VARCHAR(36),
        IN p_transactionId VARCHAR(36),
        IN p_fromLocationId VARCHAR(36),
        IN p_toLocationId VARCHAR(36),
        IN p_quantity INT,
        IN p_weight DECIMAL(10,3),
        IN p_userId VARCHAR(36)
    )
    BEGIN
        CALL sp_ProcessStockMovement(
            p_outId, p_productId, p_lotId, p_transactionId, 'TRANSFER_OUT',
            p_fromLocationId, NULL, -p_quantity, -p_weight, p_userId
        );

        CALL sp_ProcessStockMovement(
            p_inId, p_productId, p_lotId, p_transactionId, 'TRANSFER_IN',
            NULL, p_toLocationId, p_quantity, p_weight, p_userId
        );
    END;
  `;

  try {
    await prisma.$executeRawUnsafe(`DROP PROCEDURE IF EXISTS sp_ProcessStockMovement`);
    await prisma.$executeRawUnsafe(sp1);
    console.log('✓ sp_ProcessStockMovement created');

    await prisma.$executeRawUnsafe(`DROP PROCEDURE IF EXISTS sp_ReverseStockMovement`);
    await prisma.$executeRawUnsafe(sp2);
    console.log('✓ sp_ReverseStockMovement created');

    await prisma.$executeRawUnsafe(`DROP PROCEDURE IF EXISTS sp_TransferStock`);
    await prisma.$executeRawUnsafe(sp3);
    console.log('✓ sp_TransferStock created');

    const spPostInvoice = `
    CREATE PROCEDURE sp_PostInvoice(
        IN p_invoiceId VARCHAR(36),
        IN p_invoiceNumber VARCHAR(100),
        IN p_type VARCHAR(20),
        IN p_customerId VARCHAR(36),
        IN p_subTotal DECIMAL(12,2),
        IN p_taxTotal DECIMAL(12,2),
        IN p_discount DECIMAL(12,2),
        IN p_grandTotal DECIMAL(12,2),
        IN p_notes TEXT,
        IN p_userId VARCHAR(36),
        IN p_itemsJson JSON,
        IN p_paymentsJson JSON
    )
    BEGIN
        DECLARE v_transactionId VARCHAR(36) DEFAULT UUID();
        DECLARE v_invoiceExists INT;
        DECLARE v_itemCount INT;
        DECLARE v_paymentCount INT;
        DECLARE i INT DEFAULT 0;
        
        DECLARE v_itemId VARCHAR(36);
        DECLARE v_productId VARCHAR(36);
        DECLARE v_lotId VARCHAR(36);
        DECLARE v_quantity INT;
        DECLARE v_weight DECIMAL(10,3);
        DECLARE v_rate DECIMAL(10,2);
        DECLARE v_purity DECIMAL(5,3);
        DECLARE v_makingCharge DECIMAL(10,2);
        DECLARE v_wastage DECIMAL(5,2);
        DECLARE v_hsn VARCHAR(50);
        DECLARE v_discountPercent DECIMAL(5,2);
        DECLARE v_gstPercent DECIMAL(5,2);
        DECLARE v_amount DECIMAL(12,2);
        
        DECLARE v_currentQty INT;
        DECLARE v_currentWeight DECIMAL(10,3);
        
        START TRANSACTION;

        SELECT COUNT(*) INTO v_invoiceExists FROM invoices WHERE invoiceNumber = p_invoiceNumber;
        IF v_invoiceExists > 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate invoice number. Idempotency check failed.';
        END IF;

        INSERT INTO transaction_references (
            id, referenceCode, type, status, notes, createdAt, updatedAt
        ) VALUES (
            v_transactionId, p_invoiceNumber, p_type, 'COMPLETED', p_notes, NOW(3), NOW(3)
        );

        INSERT INTO invoices (
            id, invoiceNumber, type, status, customerId, 
            subTotal, taxTotal, discount, grandTotal, 
            transactionId, notes, createdById, createdAt, updatedAt
        ) VALUES (
            p_invoiceId, p_invoiceNumber, p_type, 'POSTED', p_customerId, 
            p_subTotal, p_taxTotal, p_discount, p_grandTotal, 
            v_transactionId, p_notes, p_userId, NOW(3), NOW(3)
        );

        SET v_itemCount = JSON_LENGTH(p_itemsJson);
        WHILE i < v_itemCount DO
            SET v_itemId = JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].id')));
            SET v_productId = JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].productId')));
            SET v_lotId = JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].lotId')));
            IF v_lotId = 'null' THEN SET v_lotId = NULL; END IF;
            
            SET v_quantity = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].quantity'))) AS SIGNED);
            SET v_weight = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].weight'))) AS DECIMAL(10,3));
            SET v_rate = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].rate'))) AS DECIMAL(10,2));
            SET v_purity = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].purity'))) AS DECIMAL(5,3));
            SET v_makingCharge = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].makingCharge'))) AS DECIMAL(10,2));
            SET v_wastage = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].wastage'))) AS DECIMAL(5,2));
            SET v_hsn = JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].hsn')));
            IF v_hsn = 'null' THEN SET v_hsn = NULL; END IF;
            
            SET v_discountPercent = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].discountPercent'))) AS DECIMAL(5,2));
            SET v_gstPercent = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].gstPercent'))) AS DECIMAL(5,2));
            SET v_amount = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_itemsJson, CONCAT('$[', i, '].amount'))) AS DECIMAL(12,2));

            IF p_type = 'SALE' AND v_lotId IS NOT NULL THEN
                SELECT quantity, weight INTO v_currentQty, v_currentWeight
                FROM inventory_lots WHERE id = v_lotId FOR UPDATE;
                
                IF v_currentQty < v_quantity THEN
                    ROLLBACK;
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient lot quantity for sale.';
                END IF;
                
                UPDATE inventory_lots 
                SET quantity = quantity - v_quantity, weight = weight - v_weight, updatedAt = NOW(3)
                WHERE id = v_lotId;
                
                INSERT INTO stock_movements (id, productId, lotId, transactionId, type, quantityDelta, weightDelta, isReversed, userId, createdAt)
                VALUES (UUID(), v_productId, v_lotId, v_transactionId, 'SALE', -v_quantity, -v_weight, FALSE, p_userId, NOW(3));
                
            ELSEIF p_type = 'PURCHASE' AND v_lotId IS NOT NULL THEN
                SELECT quantity, weight INTO v_currentQty, v_currentWeight
                FROM inventory_lots WHERE id = v_lotId FOR UPDATE;
                
                UPDATE inventory_lots 
                SET quantity = quantity + v_quantity, weight = weight + v_weight, updatedAt = NOW(3)
                WHERE id = v_lotId;
                
                INSERT INTO stock_movements (id, productId, lotId, transactionId, type, quantityDelta, weightDelta, isReversed, userId, createdAt)
                VALUES (UUID(), v_productId, v_lotId, v_transactionId, 'PURCHASE', v_quantity, v_weight, FALSE, p_userId, NOW(3));
            END IF;

            INSERT INTO invoice_items (
                id, invoiceId, productId, lotId, quantity, weight,
                rate, purity, makingCharge, wastage, hsn,
                discountPercent, gstPercent, amount
            ) VALUES (
                v_itemId, p_invoiceId, v_productId, v_lotId, v_quantity, v_weight,
                v_rate, v_purity, v_makingCharge, v_wastage, v_hsn,
                v_discountPercent, v_gstPercent, v_amount
            );

            SET i = i + 1;
        END WHILE;

        IF p_paymentsJson IS NOT NULL AND JSON_TYPE(p_paymentsJson) = 'ARRAY' THEN
            SET v_paymentCount = JSON_LENGTH(p_paymentsJson);
            SET i = 0;
            WHILE i < v_paymentCount DO
                INSERT INTO invoice_payments (
                    id, invoiceId, amount, mode, referenceId, status, processedById, createdAt
                ) VALUES (
                    UUID(), p_invoiceId, 
                    CAST(JSON_UNQUOTE(JSON_EXTRACT(p_paymentsJson, CONCAT('$[', i, '].amount'))) AS DECIMAL(12,2)),
                    JSON_UNQUOTE(JSON_EXTRACT(p_paymentsJson, CONCAT('$[', i, '].mode'))),
                    JSON_UNQUOTE(JSON_EXTRACT(p_paymentsJson, CONCAT('$[', i, '].referenceId'))),
                    'COMPLETED', p_userId, NOW(3)
                );
                SET i = i + 1;
            END WHILE;
        END IF;

        COMMIT;
    END;
    `;

    const spReverseInvoice = `
    CREATE PROCEDURE sp_ReverseInvoice(
        IN p_invoiceId VARCHAR(36),
        IN p_userId VARCHAR(36)
    )
    BEGIN
        DECLARE v_transactionId VARCHAR(36);
        DECLARE v_status VARCHAR(20);
        DECLARE v_type VARCHAR(20);
        DECLARE v_newTransactionId VARCHAR(36) DEFAULT UUID();
        
        DECLARE done INT DEFAULT FALSE;
        DECLARE cur_itemId VARCHAR(36);
        DECLARE cur_productId VARCHAR(36);
        DECLARE cur_lotId VARCHAR(36);
        DECLARE cur_qty INT;
        DECLARE cur_weight DECIMAL(10,3);
        
        DECLARE cur CURSOR FOR 
            SELECT id, productId, lotId, quantity, weight 
            FROM invoice_items WHERE invoiceId = p_invoiceId;
            
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

        START TRANSACTION;

        SELECT transactionId, status, type INTO v_transactionId, v_status, v_type
        FROM invoices WHERE id = p_invoiceId FOR UPDATE;

        IF v_status = 'REVERSED' THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invoice is already reversed.';
        END IF;

        UPDATE invoices SET status = 'REVERSED', updatedAt = NOW(3) WHERE id = p_invoiceId;

        INSERT INTO transaction_references (
            id, referenceCode, type, status, notes, createdAt, updatedAt
        ) VALUES (
            v_newTransactionId, CONCAT('REV-', p_invoiceId), 'ADJUSTMENT', 'COMPLETED', 'Reversal of invoice', NOW(3), NOW(3)
        );

        OPEN cur;
        read_loop: LOOP
            FETCH cur INTO cur_itemId, cur_productId, cur_lotId, cur_qty, cur_weight;
            IF done THEN
                LEAVE read_loop;
            END IF;

            IF cur_lotId IS NOT NULL THEN
                IF v_type = 'SALE' THEN
                    UPDATE inventory_lots 
                    SET quantity = quantity + cur_qty, weight = weight + cur_weight, updatedAt = NOW(3)
                    WHERE id = cur_lotId;
                    
                    INSERT INTO stock_movements (id, productId, lotId, transactionId, type, quantityDelta, weightDelta, isReversed, reversalForId, userId, createdAt)
                    VALUES (UUID(), cur_productId, cur_lotId, v_newTransactionId, 'SALE_REVERSAL', cur_qty, cur_weight, FALSE, NULL, p_userId, NOW(3));
                ELSEIF v_type = 'PURCHASE' THEN
                    UPDATE inventory_lots 
                    SET quantity = quantity - cur_qty, weight = weight - cur_weight, updatedAt = NOW(3)
                    WHERE id = cur_lotId;
                    
                    INSERT INTO stock_movements (id, productId, lotId, transactionId, type, quantityDelta, weightDelta, isReversed, reversalForId, userId, createdAt)
                    VALUES (UUID(), cur_productId, cur_lotId, v_newTransactionId, 'PURCHASE_REVERSAL', -cur_qty, -cur_weight, FALSE, NULL, p_userId, NOW(3));
                END IF;
            END IF;
        END LOOP;
        CLOSE cur;

        UPDATE invoice_payments SET status = 'REFUNDED' WHERE invoiceId = p_invoiceId;

        COMMIT;
    END;
    `;

    await prisma.$executeRawUnsafe(`DROP PROCEDURE IF EXISTS sp_PostInvoice`);
    await prisma.$executeRawUnsafe(spPostInvoice);
    console.log('✓ sp_PostInvoice created');

    await prisma.$executeRawUnsafe(`DROP PROCEDURE IF EXISTS sp_ReverseInvoice`);
    await prisma.$executeRawUnsafe(spReverseInvoice);
    console.log('✓ sp_ReverseInvoice created');

    const spPostDraftInvoice = `
    CREATE PROCEDURE sp_PostDraftInvoice(
        IN p_invoiceId VARCHAR(36),
        IN p_userId VARCHAR(36),
        IN p_paymentsJson JSON
    )
    BEGIN
        DECLARE v_transactionId VARCHAR(36) DEFAULT UUID();
        DECLARE v_invoiceNumber VARCHAR(100);
        DECLARE v_status VARCHAR(20);
        DECLARE v_type VARCHAR(20);
        DECLARE v_customerId VARCHAR(36);
        DECLARE v_paymentCount INT;
        DECLARE i INT DEFAULT 0;
        
        DECLARE v_currentQty INT;
        DECLARE v_currentWeight DECIMAL(10,3);

        DECLARE done INT DEFAULT FALSE;
        DECLARE cur_productId VARCHAR(36);
        DECLARE cur_lotId VARCHAR(36);
        DECLARE cur_qty INT;
        DECLARE cur_weight DECIMAL(10,3);
        
        DECLARE item_cur CURSOR FOR 
            SELECT productId, lotId, quantity, weight 
            FROM invoice_items 
            WHERE invoiceId = p_invoiceId;
            
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

        START TRANSACTION;

        SELECT status, type, invoiceNumber, customerId INTO v_status, v_type, v_invoiceNumber, v_customerId
        FROM invoices 
        WHERE id = p_invoiceId FOR UPDATE;

        IF v_status IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invoice not found.';
        ELSEIF v_status <> 'DRAFT' THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invoice is not in DRAFT status.';
        END IF;

        INSERT INTO transaction_references (
            id, referenceCode, type, status, notes, createdAt, updatedAt
        ) VALUES (
            v_transactionId, v_invoiceNumber, v_type, 'COMPLETED', CONCAT('Posted from draft: ', p_invoiceId), NOW(3), NOW(3)
        );

        UPDATE invoices 
        SET status = 'POSTED', transactionId = v_transactionId, updatedAt = NOW(3) 
        WHERE id = p_invoiceId;

        OPEN item_cur;
        read_loop: LOOP
            FETCH item_cur INTO cur_productId, cur_lotId, cur_qty, cur_weight;
            IF done THEN
                LEAVE read_loop;
            END IF;

            IF cur_lotId IS NOT NULL THEN
                IF v_type = 'SALE' THEN
                    SELECT quantity, weight INTO v_currentQty, v_currentWeight
                    FROM inventory_lots WHERE id = cur_lotId FOR UPDATE;
                    
                    IF v_currentQty < cur_qty THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient lot quantity for sale.';
                    END IF;
                    
                    UPDATE inventory_lots 
                    SET quantity = quantity - cur_qty, weight = weight - cur_weight, updatedAt = NOW(3)
                    WHERE id = cur_lotId;
                    
                    INSERT INTO stock_movements (id, productId, lotId, transactionId, type, quantityDelta, weightDelta, isReversed, userId, createdAt)
                    VALUES (UUID(), cur_productId, cur_lotId, v_transactionId, 'SALE', -cur_qty, -cur_weight, FALSE, p_userId, NOW(3));
                    
                ELSEIF v_type = 'PURCHASE' THEN
                    SELECT quantity, weight INTO v_currentQty, v_currentWeight
                    FROM inventory_lots WHERE id = cur_lotId FOR UPDATE;
                    
                    UPDATE inventory_lots 
                    SET quantity = quantity + cur_qty, weight = weight + cur_weight, updatedAt = NOW(3)
                    WHERE id = cur_lotId;
                    
                    INSERT INTO stock_movements (id, productId, lotId, transactionId, type, quantityDelta, weightDelta, isReversed, userId, createdAt)
                    VALUES (UUID(), cur_productId, cur_lotId, v_transactionId, 'PURCHASE', cur_qty, cur_weight, FALSE, p_userId, NOW(3));
                END IF;
            END IF;
        END LOOP;
        CLOSE item_cur;

        IF p_paymentsJson IS NOT NULL AND JSON_TYPE(p_paymentsJson) = 'ARRAY' THEN
            SET v_paymentCount = JSON_LENGTH(p_paymentsJson);
            SET i = 0;
            WHILE i < v_paymentCount DO
                INSERT INTO invoice_payments (
                    id, invoiceId, amount, mode, referenceId, status, processedById, createdAt
                ) VALUES (
                    UUID(), p_invoiceId, 
                    CAST(JSON_UNQUOTE(JSON_EXTRACT(p_paymentsJson, CONCAT('$[', i, '].amount'))) AS DECIMAL(12,2)),
                    JSON_UNQUOTE(JSON_EXTRACT(p_paymentsJson, CONCAT('$[', i, '].mode'))),
                    JSON_UNQUOTE(JSON_EXTRACT(p_paymentsJson, CONCAT('$[', i, '].referenceId'))),
                    'COMPLETED', p_userId, NOW(3)
                );
                SET i = i + 1;
            END WHILE;
        END IF;

        COMMIT;
    END;
    `;

    await prisma.$executeRawUnsafe(`DROP PROCEDURE IF EXISTS sp_PostDraftInvoice`);
    await prisma.$executeRawUnsafe(spPostDraftInvoice);
    console.log('✓ sp_PostDraftInvoice created');

    console.log('Stored procedures deployed successfully!');
  } catch (error) {
    console.error('Failed to deploy procedures:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deployProcedures();
