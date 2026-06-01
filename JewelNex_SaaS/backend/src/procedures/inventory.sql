-- ==============================================================================
-- JewelNex SaaS - Core Inventory Stored Procedures
-- Purpose: Guarantee atomicity, negative stock prevention, and immutable ledger
-- ==============================================================================

DELIMITER //

-- 1. Process a Single Stock Movement
DROP PROCEDURE IF EXISTS sp_ProcessStockMovement //
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

    -- Start Transaction
    START TRANSACTION;

    -- If outgoing (SALE, TRANSFER out), check negative stock
    IF p_quantityDelta < 0 AND p_fromLocationId IS NOT NULL THEN
        -- Lock the lot row for read
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

    -- 1. Insert Immutable Ledger Entry
    INSERT INTO stock_movements (
        id, productId, lotId, transactionId, type, 
        fromLocationId, toLocationId, quantityDelta, weightDelta, 
        isReversed, userId, createdAt
    ) VALUES (
        p_id, p_productId, p_lotId, p_transactionId, p_type, 
        p_fromLocationId, p_toLocationId, p_quantityDelta, p_weightDelta, 
        FALSE, p_userId, NOW(3)
    );

    -- 2. Update Lot Quantity & Weight (Source of Truth for specific items)
    -- If receiving (PURCHASE, RETURN, TRANSFER in)
    IF p_toLocationId IS NOT NULL AND p_quantityDelta > 0 THEN
        UPDATE inventory_lots 
        SET quantity = quantity + p_quantityDelta,
            weight = weight + p_weightDelta,
            updatedAt = NOW(3)
        WHERE id = p_lotId;
    END IF;

    -- If sending (SALE, TRANSFER out)
    IF p_fromLocationId IS NOT NULL AND p_quantityDelta < 0 THEN
        UPDATE inventory_lots 
        SET quantity = quantity + p_quantityDelta,
            weight = weight + p_weightDelta,
            updatedAt = NOW(3)
        WHERE id = p_lotId;
    END IF;

    COMMIT;
END //

-- 2. Reverse a Stock Movement
DROP PROCEDURE IF EXISTS sp_ReverseStockMovement //
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

    -- Fetch original movement details
    SELECT productId, lotId, transactionId, type, fromLocationId, toLocationId, quantityDelta, weightDelta, isReversed
    INTO v_productId, v_lotId, v_transactionId, v_type, v_fromLocationId, v_toLocationId, v_qtyDelta, v_weightDelta, v_isReversed
    FROM stock_movements
    WHERE id = p_originalMovementId FOR UPDATE;

    -- Ensure it's not already reversed
    IF v_isReversed = TRUE THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Movement is already reversed.';
    END IF;

    -- Mark original as reversed
    UPDATE stock_movements SET isReversed = TRUE WHERE id = p_originalMovementId;

    -- Insert compensating transaction
    INSERT INTO stock_movements (
        id, productId, lotId, transactionId, type, 
        fromLocationId, toLocationId, quantityDelta, weightDelta, 
        isReversed, reversalForId, userId, createdAt
    ) VALUES (
        p_newMovementId, v_productId, v_lotId, v_transactionId, CONCAT(v_type, '_REVERSAL'), 
        v_toLocationId, v_fromLocationId, -v_qtyDelta, -v_weightDelta, 
        FALSE, p_originalMovementId, p_userId, NOW(3)
    );

    -- Reverse Lot quantities
    IF v_lotId IS NOT NULL THEN
        UPDATE inventory_lots 
        SET quantity = quantity - v_qtyDelta,
            weight = weight - v_weightDelta,
            updatedAt = NOW(3)
        WHERE id = v_lotId;
    END IF;

    COMMIT;
END //

-- 3. Process Stock Transfer (Wraps sp_ProcessStockMovement for atomic A -> B)
DROP PROCEDURE IF EXISTS sp_TransferStock //
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
    -- OUT Movement (-)
    CALL sp_ProcessStockMovement(
        p_outId, p_productId, p_lotId, p_transactionId, 'TRANSFER_OUT',
        p_fromLocationId, NULL, -p_quantity, -p_weight, p_userId
    );

    -- IN Movement (+)
    CALL sp_ProcessStockMovement(
        p_inId, p_productId, p_lotId, p_transactionId, 'TRANSFER_IN',
        NULL, p_toLocationId, p_quantity, p_weight, p_userId
    );
END //

DELIMITER ;
