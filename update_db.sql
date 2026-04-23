-- SQL script to add missing columns to InvoiceItem table
-- Run this on your jewellery_v5.db if automatic migrations fail

ALTER TABLE InvoiceItems ADD COLUMN RI TEXT DEFAULT 'I';
ALTER TABLE InvoiceItems ADD COLUMN FineWt DECIMAL(10, 3) DEFAULT 0;
ALTER TABLE Invoices ADD COLUMN PrintOption TEXT DEFAULT 'None';
