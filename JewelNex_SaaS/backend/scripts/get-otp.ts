import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getOTP(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { verificationToken: true }
  });
  console.log(`OTP for ${email}: ${user?.verificationToken}`);
  await prisma.$disconnect();
}

const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

getOTP(email);
