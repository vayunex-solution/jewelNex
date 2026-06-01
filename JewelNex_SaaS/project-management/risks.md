# Project Risks

### 1. Race Conditions in Accounting
**Risk:** Double-billing or duplicate stock deduction due to concurrent requests.
**Mitigation:** Idempotency keys must be enforced for all state-mutating requests (Invoices, Vouchers). Prisma Transactions will ensure atomicity.

### 2. Secret Exposure
**Risk:** Hardcoded credentials in scratch scripts.
**Mitigation:** Strict enforcement of `process.env` usage. All future scripts must load variables from `.env`.
