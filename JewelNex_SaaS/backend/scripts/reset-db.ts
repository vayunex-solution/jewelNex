import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env.test if running locally
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const prisma = new PrismaClient();

async function resetDb() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(`Cannot reset DB: NODE_ENV is ${process.env.NODE_ENV}, expected 'test'. Ensure .env.test is loaded.`);
  }

  console.log('Resetting test database...');
  await prisma.activityLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  console.log('Test database reset successfully.');
  process.exit(0);
}

resetDb().catch((e) => {
  console.error('Failed to reset DB:', e);
  process.exit(1);
});
