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
    await prisma.activityLog.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

export async function closeDb() {
  await prisma.$disconnect();
}
