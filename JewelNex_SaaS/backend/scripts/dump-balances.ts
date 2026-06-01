import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function dump() {
  const rangeClause: any = { lte: new Date(Date.now() + 60000) };
  
  const saleItemsAll = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        type: 'SALE',
        status: 'POSTED'
      }
    },
    include: { invoice: true }
  });
  console.log('--- saleItemsAll (without range) ---');
  console.log(saleItemsAll.map(item => ({ id: item.id, qty: item.quantity, invoiceId: item.invoiceId, invoiceType: item.invoice.type, status: item.invoice.status, createdAt: item.invoice.createdAt })));

  const saleItemsWithRange = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        type: 'SALE',
        status: 'POSTED',
        createdAt: rangeClause
      }
    },
    include: { invoice: true }
  });
  console.log('--- saleItemsWithRange (with range) ---');
  console.log(saleItemsWithRange.map(item => ({ id: item.id, qty: item.quantity, invoiceId: item.invoiceId, invoiceType: item.invoice.type, status: item.invoice.status, createdAt: item.invoice.createdAt })));
}

dump().then(() => prisma.$disconnect());
