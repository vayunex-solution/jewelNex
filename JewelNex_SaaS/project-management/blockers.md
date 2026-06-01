# Project Blockers

### 1. Database Credentials & Isolation
**Issue:** Cannot automate test isolation because the shared hosting environment restricts `CREATE DATABASE` and `ALTER USER` privileges via Prisma.
**Resolution Needed:** User must manually rotate the exposed MySQL password and create a `vayunexs_jewelnex_test` database via cPanel.

### 2. SMTP Sandbox
**Issue:** SMTP server (vayunexsolution.com) rejects test emails sent to its own domain if the account doesn't exist (550 No Such User Here).
**Resolution Needed:** Implement a test-mode flag that intercepts email sending during automated E2E tests and writes the OTP to the console or directly queries the DB.
