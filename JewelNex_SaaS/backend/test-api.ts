import prisma from './src/config/database';
import jwt from 'jsonwebtoken';
import { env } from './src/config/env';


async function test() {
  try {
    const user = await prisma.user.findFirst({ include: { role: true } });
    if (!user) return console.log("No user");

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log("Token:", token);

    const res = await fetch('http://localhost:5000/api/v1/inventory/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("Error:", err.response?.data || err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
