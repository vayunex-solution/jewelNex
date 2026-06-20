import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Dumping database counts...');
  const users = await prisma.user.findMany({ include: { role: true, company: true } });
  const companies = await prisma.company.findMany();
  const companySettings = await prisma.companySettings.findMany();
  const products = await prisma.product.findMany();
  const customers = await prisma.customer.findMany();
  const invoices = await prisma.invoice.findMany();
  const locations = await prisma.location.findMany();
  const stockMovements = await prisma.stockMovement.findMany();
  const vouchers = await prisma.voucher.findMany();
  const voucherEntries = await prisma.voucherEntry.findMany();
  const accountHeads = await prisma.accountHead.findMany();
  const accountGroups = await prisma.accountGroup.findMany();

  console.log(`Users: ${users.length}`);
  for (const u of users) {
    console.log(` - User: ${u.name} (${u.email}), Role: ${u.role?.name}, Company: ${u.company?.name} (ID: ${u.companyId})`);
  }
  console.log(`Companies: ${companies.length}`);
  for (const c of companies) {
    console.log(` - Company: ${c.name} (ID: ${c.id})`);
  }
  console.log(`CompanySettings: ${companySettings.length}`);
  console.log(`Products: ${products.length}`);
  for (const p of products) {
    console.log(` - Product: ${p.sku} - ${p.name}`);
  }
  console.log(`Customers: ${customers.length}`);
  for (const cust of customers) {
    console.log(` - Customer: ${cust.name} (ID: ${cust.id}), CompanyID: ${cust.companyId}`);
  }
  console.log(`Invoices: ${invoices.length}`);
  console.log(`Locations: ${locations.length}`);
  console.log(`StockMovements: ${stockMovements.length}`);
  console.log(`Vouchers: ${vouchers.length}`);
  console.log(`VoucherEntries: ${voucherEntries.length}`);
  console.log(`AccountHeads: ${accountHeads.length}`);
  console.log(`AccountGroups: ${accountGroups.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
