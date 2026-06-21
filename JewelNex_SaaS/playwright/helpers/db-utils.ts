import prisma from '../../backend/src/config/database';
import dotenv from 'dotenv';
import path from 'path';

// Load backend env
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

/**
 * Fetch the latest verification token for a given email.
 * This is used for automated signup testing.
 */
export async function getLatestVerificationToken(email: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
    select: { verificationToken: true }
  });
  return user?.verificationToken || null;
}

/**
 * Fetch the latest reset token for a given email.
 */
export async function getLatestResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
    select: { resetToken: true }
  });
  return user?.resetToken || null;
}

/**
 * Clean up test users from the database.
 */
export async function cleanupTestUser(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const companyId = user.companyId;
    if (companyId) {
      // 1. Delete Activity logs, Audit Trails
      await prisma.activityLog.deleteMany({ where: { userId: user.id } }).catch(() => {});
      await prisma.auditTrail.deleteMany({ where: { userId: user.id } }).catch(() => {});

      // 2. Delete VoucherEntries and Vouchers
      const invoices = await prisma.invoice.findMany({ where: { companyId } });
      const invoiceIds = invoices.map(i => i.id);
      await prisma.voucherEntry.deleteMany({ where: { voucher: { reference: { in: invoiceIds } } } }).catch(() => {});
      await prisma.voucher.deleteMany({ where: { reference: { in: invoiceIds } } }).catch(() => {});

      // 3. Delete InvoicePayments, InvoiceItems, Invoices
      await prisma.invoicePayment.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).catch(() => {});
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { companyId } }).catch(() => {});

      // 4. Delete StockMovements, InventoryLots, Products
      await prisma.stockMovement.deleteMany({ where: { userId: user.id } }).catch(() => {});
      await prisma.stockMovement.deleteMany({ where: { product: { companyId } } }).catch(() => {});
      await prisma.inventoryLot.deleteMany({ where: { product: { companyId } } }).catch(() => {});
      await prisma.product.deleteMany({ where: { companyId } }).catch(() => {});

      // 5. Delete Locations
      await prisma.location.deleteMany({ where: { companyId } }).catch(() => {});

      // 6. Delete AccountHeads, Customers
      await prisma.accountHead.deleteMany({ where: { customer: { companyId } } }).catch(() => {});
      await prisma.customer.deleteMany({ where: { companyId } }).catch(() => {});

      // 7. Delete Sequences, CompanySettings
      await prisma.sequence.deleteMany({ where: { companyId } }).catch(() => {});
      await prisma.companySettings.deleteMany({ where: { companyId } }).catch(() => {});

      // 8. Finally delete User and Company
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      await prisma.company.delete({ where: { id: companyId } }).catch(() => {});
    } else {
      await prisma.activityLog.deleteMany({ where: { userId: user.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }
  }
}

export async function closeDb() {
  await prisma.$disconnect();
}
