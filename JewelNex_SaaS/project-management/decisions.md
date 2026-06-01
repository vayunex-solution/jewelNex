# Architectural Decisions Record (ADR)

## 1. Database ORM: Prisma v5
**Decision:** Downgraded from Prisma v7 to Prisma v5.
**Reason:** Prisma v7 enforces Driver Adapters or strictly structured `prisma.config.ts` which caused connectivity timeouts and engine resolution issues on the MariaDB shared hosting. v5 natively supports direct schema connection strings and is highly stable.

## 2. Inventory Ledger Approach
**Decision:** Discard in-memory stock counters for a strict `StockMovement` ledger.
**Reason:** Legacy ASP.NET code exhibited severe race condition risks. A ledger guarantees immutable transaction tracking and accurate recalculations.

## 3. Hybrid ORM + Stored Procedure Strategy
**Decision:** Use Prisma for CRUD/Reads and MySQL Stored Procedures for core transaction logic (Inventory/Ledgers).
**Reason:** To guarantee atomicity, rollback-safety, and concurrency for critical stock movements, while maintaining Prisma's rapid development speed for dashboard and API reads.
