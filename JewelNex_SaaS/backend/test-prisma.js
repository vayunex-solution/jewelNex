const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({}); // Pass an empty object
async function test() {
  try {
    const roles = await prisma.role.findMany();
    console.log('Roles:', roles);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
